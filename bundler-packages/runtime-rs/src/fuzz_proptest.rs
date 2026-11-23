use crate::{generate_runtime, generate_runtime_js, ContractPackage, ModuleType};
use foundry_compilers::artifacts::Contract;
use oxc::{allocator::Allocator, parser::Parser, semantic::SemanticBuilder, span::SourceType};
use proptest::prelude::*;
use proptest::test_runner::RngSeed;
use serde_json::{json, Value};

fn ident_strategy() -> impl Strategy<Value = String> {
    "[A-Z][a-zA-Z0-9_]{1,16}"
}

fn sol_type_strategy() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("uint256".to_string()),
        Just("int256".to_string()),
        Just("address".to_string()),
        Just("bool".to_string()),
        Just("bytes32".to_string()),
        Just("bytes".to_string()),
        Just("string".to_string()),
        Just("uint8".to_string()),
    ]
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 1024, rng_seed: RngSeed::Fixed(0xa11017), ..ProptestConfig::default() })]

    #[test]
    fn fuzz_generate_runtime_never_panics_and_emits_expected_exports(
        contract_names in prop::collection::btree_set(ident_strategy(), 0..5),
        fn_name in "[a-z][a-zA-Z0-9_]{1,12}",
        input_type in sol_type_strategy(),
        output_type in sol_type_strategy(),
        mutability in prop_oneof![Just("pure"), Just("view"), Just("nonpayable"), Just("payable")],
        module_idx in 0usize..4,
        use_scoped_pkg in any::<bool>(),
        include_bytecode in any::<bool>(),
    ) {
        let mut contracts = Vec::new();
        for name in &contract_names {
            let contract_json = json!({
                "abi": [
                    {
                        "type": "function",
                        "name": fn_name,
                        "inputs": [{ "name": "arg0", "type": input_type }],
                        "outputs": [{ "name": "", "type": output_type }],
                        "stateMutability": mutability
                    },
                    {
                        "type": "event",
                        "name": "FuzzEvent",
                        "inputs": [{ "name": "sender", "type": "address", "indexed": true }],
                        "anonymous": false
                    },
                    {
                        "type": "error",
                        "name": "FuzzError",
                        "inputs": [{ "name": "code", "type": "uint256" }]
                    }
                ],
                "evm": {
                    "bytecode": { "object": "60006000f3" },
                    "deployedBytecode": { "object": "60006000f3" }
                }
            });
            let contract: Contract = serde_json::from_value(contract_json).unwrap();
            contracts.push((name.clone(), contract));
        }

        let module_type = match module_idx {
            0 => ModuleType::Ts,
            1 => ModuleType::Cjs,
            2 => ModuleType::Mjs,
            _ => ModuleType::Dts,
        };
        let is_cjs = module_idx == 1;
        let is_dts = module_idx == 3;
        let pkg = if use_scoped_pkg {
            ContractPackage::TevmContractScoped
        } else {
            ContractPackage::TevmContract
        };
        let pkg_str = if use_scoped_pkg {
            "@tevm/contract"
        } else {
            "tevm/contract"
        };

        let output = generate_runtime(contracts, module_type, pkg, include_bytecode);

        if contract_names.is_empty() {
            prop_assert!(output.contains("No contracts found"));
        } else {
            prop_assert!(output.contains(pkg_str));
            for name in &contract_names {
                let needle = if is_cjs {
                    format!("module.exports.{} = createContract(_{});", name, name)
                } else if is_dts {
                    format!("export const {}: Contract<", name)
                } else {
                    format!("export const {} = createContract(_{});", name, name)
                };
                prop_assert!(
                    output.contains(&needle),
                    "missing expected export {}",
                    needle
                );
            }
        }
    }
}

fn check_module(source: &str, kind: &str) -> Result<(), TestCaseError> {
    let source_type = match kind {
        "ts" => SourceType::ts(),
        "mjs" => SourceType::mjs(),
        "cjs" => SourceType::cjs(),
        "dts" => SourceType::d_ts(),
        _ => unreachable!(),
    };
    let arena = Allocator::default();
    let parsed = Parser::new(&arena, source, source_type).parse();
    prop_assert!(
        parsed.diagnostics.is_empty(),
        "{kind} parse: {:?}",
        parsed.diagnostics
    );
    let checked = SemanticBuilder::new()
        .with_check_syntax_error(true)
        .build(&parsed.program);
    prop_assert!(
        checked.diagnostics.is_empty(),
        "{kind} bindings: {:?}",
        checked.diagnostics
    );
    Ok(())
}

fn generate(contracts: &Value, kind: &str, include: bool) -> napi::Result<String> {
    generate_runtime_js(
        contracts.to_string(),
        kind.into(),
        include,
        "@tevm/contract".into(),
    )
}

fn artifact_name() -> impl Strategy<Value = String> {
    prop_oneof![
        ident_strategy(),
        "[a-z_$][a-zA-Z0-9_$]{0,15}",
        "(?s).{0,16}",
        prop::sample::select(vec![
            "",
            "0",
            "A-B",
            "Contract",
            "createContract",
            "artifacts",
            "default",
            "class",
            "eval",
            "arguments",
            "_A",
            "_abiA",
            "_nameA",
            "__proto__",
            "Tevm$30",
            "a\nb",
            "λ",
            "a\0b",
            "a*/b"
        ])
        .prop_map(str::to_owned),
    ]
}

fn metadata(remappings: &[String]) -> String {
    json!({
        "version": 1, "compiler": {"version": "0.8.20"}, "language": "Solidity",
        "output": {"abi":[]}, "sources": {},
        "settings": {"optimizer": {"enabled": true, "runs": 200}, "remappings": remappings}
    })
    .to_string()
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 1024, rng_seed: RngSeed::Fixed(0xa11018), ..ProptestConfig::default() })]

    #[test]
    fn arbitrary_names_generate_valid_modules_for_both_json_shapes(
        names in prop::collection::btree_set(artifact_name(), 1..6),
    ) {
        let mut map = serde_json::Map::new();
        let mut pairs = Vec::new();
        for (i, name) in names.iter().enumerate() {
            let contract = json!({"evm":{"bytecode":{"object": format!("{i:02x}")}}});
            map.insert(name.clone(), contract.clone());
            pairs.push(json!([name, contract]));
        }
        pairs.reverse();
        for kind in ["mjs", "ts", "cjs", "dts"] {
            let source = generate(&Value::Object(map.clone()), kind, true).unwrap();
            check_module(&source, kind)?;
            prop_assert_eq!(&source, &generate(&json!(pairs), kind, true).unwrap());
            prop_assert_eq!(
                &source,
                &generate(&Value::Object(map.clone()), kind, true).unwrap()
            );
            for name in &names {
                let literal = serde_json::to_string(name).unwrap();
                prop_assert!(
                    source.contains(&literal),
                    "missing original artifact name {literal}"
                );
            }
        }
    }

    #[test]
    fn emitted_artifact_preserves_tuple_signatures_and_byte_values(
        ty in sol_type_strategy(), size in 1..12usize, name in "[A-Z][a-z]{0,8}",
        init in prop::collection::vec(any::<u8>(), 0..64),
        deployed in prop::option::of(prop::collection::vec(any::<u8>(), 0..64)),
        indexed in any::<bool>(), include in any::<bool>(),
    ) {
        let tuple = json!({"type": format!("tuple[{size}]"), "name":"v",
                "components":[{"name":"inner","type":"tuple[]","components":[{"name":"x","type":ty}]}]});
        let tuple_sig = format!("(({ty} x)[] inner)[{size}] v");
        let mut evm = json!({"bytecode":{"object":hex::encode(&init)}});
        if let Some(bytes) = &deployed {
            evm["deployedBytecode"] = json!({"object":format!("0x{}", hex::encode(bytes))});
        }
        let abi = json!([
            {"type":"constructor","inputs":[],"stateMutability":"payable"},
            {"type":"function","name":"f","inputs":[tuple],"outputs":[{"type":"bool","name":""}],"stateMutability":"view"},
            {"type":"event","name":"E","anonymous":false,"inputs":[{"type":"address","name":"a","indexed":indexed}]},
            {"type":"error","name":"Fail","inputs":[tuple]},
            {"type":"fallback","stateMutability":"payable"},
            {"type":"receive","stateMutability":"payable"}
        ]);
        let src = generate(&json!({&name:{"abi":abi,"evm":evm}}), "mjs", include).unwrap();
        let literal = src
            .split_once("export const artifacts = ")
            .unwrap()
            .1
            .trim_end_matches(";\n");
        let artifacts: Value = serde_json::from_str(literal).unwrap();
        let actual = &artifacts[&name];
        prop_assert_eq!(&actual["name"], &json!(name));
        prop_assert_eq!(
            &actual["bytecode"],
            &json!(include.then(|| format!("0x{}", hex::encode(&init))))
        );
        prop_assert_eq!(
            &actual["deployedBytecode"],
            &json!(deployed
                .filter(|_| include)
                .map(|v| format!("0x{}", hex::encode(v))))
        );
        let mut expected = vec![
            "constructor() payable".to_string(),
            "fallback() external payable".to_string(),
            "receive() external payable".to_string(),
            format!("function f({tuple_sig}) view returns (bool)"),
            format!(
                "event E(address{} a)",
                if indexed { " indexed" } else { "" }
            ),
            format!("error Fail({tuple_sig})"),
        ];
        let mut actual: Vec<String> =
            serde_json::from_value(actual["humanReadableAbi"].clone()).unwrap();
        actual.sort();
        expected.sort();
        prop_assert_eq!(actual, expected);
    }

    #[test]
    fn foundry_metadata_remappings_are_validated_at_artifact_ingress(
        context in prop::option::of("[a-z/]{1,12}"),
        package in "@[a-z]{1,10}/", target in "[a-zA-Z0-9_/.=-]{1,18}",
        bad in "[a-zA-Z/:]{0,18}",
    ) {
        let remap = format!(
            "{}{package}={target}",
            context.map(|c| format!("{c}:")).unwrap_or_default()
        );
        let bare = generate(&json!({"A":{}}), "mjs", false).unwrap();
        let with = |r| json!({"A":{"metadata":metadata(&[r])}});
        prop_assert_eq!(generate(&with(remap), "mjs", false).unwrap(), bare);
        prop_assert!(generate(&with(bad), "mjs", false).is_err());
    }

    #[test]
    fn malformed_wire_arguments_return_errors(raw in "(?s).{0,96}", choice in 0..5u8) {
        let (text, kind, package) = match choice {
            0 => (format!("{{{raw}\0"), "mjs".into(), "tevm/contract".into()),
            1 => (
                json!({"A":{"abi":[{"type":format!("invalid{raw}")}]}}).to_string(),
                "ts".into(),
                "tevm/contract".into(),
            ),
            2 => (
                json!({"A":{"evm":{"bytecode":{"object":[raw]}}}}).to_string(),
                "cjs".into(),
                "tevm/contract".into(),
            ),
            3 => ("{}".into(), format!("?{raw}"), "tevm/contract".into()),
            _ => ("{}".into(), "dts".into(), format!("?{raw}")),
        };
        let call =
            || generate_runtime_js(text.clone(), kind.clone(), true, package.clone()).unwrap_err();
        let first = call();
        let second = call();
        prop_assert_eq!(first.status, second.status);
        prop_assert_eq!(first.reason, second.reason);
    }
}

#[test]
fn empty_and_numeric_names_generate_parseable_modules() {
    for kind in ["mjs", "cjs", "ts", "dts"] {
        let src = generate(&json!({"":{}, "0":{}}), kind, true).unwrap();
        check_module(&src, kind).unwrap();
        assert!(src.contains("\"0\""));
    }
}

#[test]
fn reordered_artifacts_emit_identical_bytes() {
    let forward = json!([["A", {}], ["B", {}]]);
    let reverse = json!([["B", {}], ["A", {}]]);
    for kind in ["mjs", "cjs", "ts", "dts"] {
        assert_eq!(
            generate(&forward, kind, true).unwrap(),
            generate(&reverse, kind, true).unwrap()
        );
    }
}

#[test]
fn export_names_survive_alias_and_helper_collisions() {
    let names = [
        "A",
        "_A",
        "_nameA",
        "_abiA",
        "0",
        "Tevm$30",
        "artifacts",
        "__proto__",
        "Contract",
    ];
    let pairs: Vec<_> = names.iter().map(|n| json!([n, {}])).collect();
    for kind in ["cjs", "mjs", "ts", "dts"] {
        let source = generate(&json!(pairs), kind, false).unwrap();
        check_module(&source, kind).unwrap();
        assert!(source.contains("Tevm$30$"));
        if kind != "dts" {
            assert!(source.contains("[\"__proto__\"]:"));
        }
    }
}
