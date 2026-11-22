use crate::{generate_runtime, ContractPackage, ModuleType};
use foundry_compilers::artifacts::Contract;
use proptest::prelude::*;
use serde_json::json;

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
    #![proptest_config(ProptestConfig::with_cases(200))]

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
                prop_assert!(output.contains(&needle), "missing expected export {}", needle);
            }
        }
    }
}
