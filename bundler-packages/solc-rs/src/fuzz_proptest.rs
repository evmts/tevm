use crate::models::{
    SolcErrorEntry, SolcInputDescription, SolcInputSource, SolcLanguage, SolcOptimizer,
    SolcSettings, SolcSourceLocation,
};
use crate::{solc::parse_output, Solc, SolcError, SolcOutput};
use proptest::prelude::*;
use proptest::test_runner::RngSeed;
use serde_json::{json, Value};
use std::collections::HashMap;

proptest! {
    #![proptest_config(ProptestConfig { cases: 1024, rng_seed: RngSeed::Fixed(0x501c), ..ProptestConfig::default() })]

    #[test]
    fn fuzz_solc_input_description_roundtrips_through_json(
        file_name in "[a-zA-Z0-9_/-]{1,24}\\.sol",
        content in ".{0,200}",
        runs in any::<u32>(),
        enabled in any::<Option<bool>>(),
        via_ir in any::<Option<bool>>(),
        lang_idx in 0usize..3,
    ) {
        let language = match lang_idx {
            0 => SolcLanguage::Solidity,
            1 => SolcLanguage::Yul,
            _ => SolcLanguage::SolidityAST,
        };
        let mut sources = HashMap::new();
        sources.insert(
            file_name,
            SolcInputSource {
                keccak256: None,
                urls: None,
                content: Some(content),
            },
        );
        let desc = SolcInputDescription {
            language,
            sources,
            settings: Some(SolcSettings {
                optimizer: Some(SolcOptimizer {
                    enabled,
                    runs,
                    details: None,
                }),
                via_ir,
                ..SolcSettings::default()
            }),
        };

        let json = serde_json::to_string(&desc).expect("serialize SolcInputDescription");
        let parsed: SolcInputDescription =
            serde_json::from_str(&json).expect("deserialize SolcInputDescription");
        prop_assert_eq!(parsed, desc);
    }

    #[test]
    fn fuzz_solc_error_entry_roundtrips_and_arbitrary_json_never_panics(
        raw in ".{0,256}",
        err_type in "[A-Za-z]{1,24}",
        component in "[a-z]{1,16}",
        severity in prop_oneof![Just("error".to_string()), Just("warning".to_string()), Just("info".to_string())],
        message in ".{0,120}",
        start in any::<u32>(),
        end in any::<u32>(),
    ) {
        let _ = serde_json::from_str::<SolcInputDescription>(&raw);
        let _ = serde_json::from_str::<SolcErrorEntry>(&raw);

        let entry = SolcErrorEntry {
            source_location: Some(SolcSourceLocation {
                file: "Contract.sol".to_string(),
                start: start.into(),
                end: end.into(),
            }),
            secondary_source_locations: None,
            error_type: err_type,
            component,
            severity,
            error_code: Some("1234".to_string()),
            message,
            formatted_message: None,
        };
        let serialized = serde_json::to_string(&entry).expect("serialize SolcErrorEntry");
        let parsed: SolcErrorEntry =
            serde_json::from_str(&serialized).expect("deserialize SolcErrorEntry");
        prop_assert_eq!(parsed, entry);
    }
}

fn version_string() -> impl Strategy<Value = String> {
    prop_oneof![
        (
            any::<u8>(),
            any::<u8>(),
            any::<u16>(),
            prop::option::of("[a-f0-9]{8}")
        )
            .prop_map(|(a, b, c, commit)| format!(
                "{a}.{b}.{c}{}",
                commit.map(|s| format!("+commit.{s}")).unwrap_or_default()
            )),
        "v0\\.8\\.[0-9]{1,2}-nightly\\.[0-9]{4}\\.[0-9]{1,2}\\.[0-9]{1,2}",
        "(?s).{0,96}",
    ]
}

fn diagnostic(severity: &str, message: &str) -> Value {
    json!({"type":"TypeError","component":"general","severity":severity,"message":message})
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 1024, rng_seed: RngSeed::Fixed(0x501d), ..ProptestConfig::default() })]

    #[test]
    fn standard_input_preserves_solc_wire_fields(
        language in prop::sample::select(vec!["Solidity", "Yul", "SolidityAST"]),
        sources in prop::collection::btree_map("[a-z/]{1,12}\\.sol", ("(?s).{0,40}", any::<bool>()), 1..5),
        runs in any::<u32>(), via_ir in any::<bool>(), cbor in any::<bool>(),
        mappings in prop::collection::vec("@[a-z]{1,8}/=lib/[a-z]{1,8}/", 0..4)
    ) {
        let sources: serde_json::Map<_, _> = sources
            .into_iter()
            .map(|(k, (v, inline))| {
                (
                    k,
                    if inline {
                        json!({"content":v})
                    } else {
                        json!({"urls":[v], "keccak256":format!("0x{}", "00".repeat(32))})
                    },
                )
            })
            .collect();
        let input = json!({"language":language,"sources":sources,
                "settings":{"viaIR":via_ir, "metadata":{"appendCBOR":cbor}, "remappings":mappings,
                    "optimizer":{"enabled":true,"runs":runs},
                    "outputSelection":{"*":{"*":["abi","evm.bytecode.object"],"":["ast"]}}}});
        let typed: SolcInputDescription = serde_json::from_value(input.clone()).unwrap();
        let bytes = serde_json::to_vec(&typed).unwrap();
        prop_assert_eq!(serde_json::from_slice::<Value>(&bytes).unwrap(), input);
        prop_assert_eq!(
            serde_json::from_slice::<SolcInputDescription>(&bytes).unwrap(),
            typed
        );
    }

    #[test]
    fn standard_output_preserves_nested_artifacts_and_diagnostics(
        file in "[a-z]{1,12}\\.sol", name in "[A-Z][A-Za-z0-9]{0,12}",
        id in any::<u32>(), bytecode in prop::collection::vec(any::<u8>(), 0..48),
        message in "(?s).{0,80}", include_sources in any::<bool>(), include_contracts in any::<bool>(),
        severity in prop::sample::select(vec!["info", "warning", "error"]),
        missing_span in any::<bool>(),
    ) {
        let object = hex::encode(bytecode);
        let mut entry = diagnostic(severity, &message);
        let (start, end) = if missing_span {
            (-1, -1)
        } else {
            (0, i64::from(id))
        };
        entry["sourceLocation"] = json!({"file":file,"start":start,"end":end});
        entry["secondarySourceLocations"] =
            json!([{"file":file,"start":start,"end":end,"message":message}]);
        let mut output = json!({"errors":[diagnostic("warning","first warning"),entry]});
        if include_sources {
            output["sources"] =
                json!({&file:{"id":id,"ast":{"nodeType":"SourceUnit","nodes":[{"name":name}]}}});
        }
        if include_contracts {
            output["contracts"] = json!({&file:{&name:{"abi":[{"type":"constructor","inputs":[]}],
                    "evm":{"bytecode":{"object":object, "linkReferences":{&file:{&name:[{"start":id,"length":20}]}}},
                    "deployedBytecode":{"object":object,"immutableReferences":{"0":[{"start":0,"length":id}]}}},
                    "storageLayout":{"storage":[],"types":{}}}}});
        }
        let bytes = serde_json::to_vec(&output).unwrap();
        let typed: SolcOutput = serde_json::from_slice(&bytes).unwrap();
        prop_assert_eq!(serde_json::to_value(&typed).unwrap(), output);
        prop_assert_eq!(
            serde_json::from_slice::<SolcOutput>(&serde_json::to_vec(&typed).unwrap()).unwrap(),
            typed.clone()
        );
        match parse_output(&bytes) {
            Err(SolcError::CompilationError(reason)) if severity == "error" => {
                prop_assert_eq!(reason, message)
            }
            Ok(parsed) if severity != "error" => prop_assert_eq!(parsed, typed),
            other => prop_assert!(false, "unexpected diagnostic result {other:?}"),
        }
    }

    #[test]
    fn compiler_versions_are_opaque_metadata(version in version_string(), file in "[a-z]{1,12}") {
        let path = std::path::PathBuf::from(file);
        let compiler = Solc::new(path.clone(), version.clone());
        let cloned = compiler.clone();
        prop_assert_eq!(cloned.version, version);
        prop_assert_eq!(cloned.path.as_ref(), &path);
    }

    #[test]
    fn corrupt_standard_json_returns_structured_errors(
        text in "(?s).{0,64}", octet in 128..=255u8, cut in any::<usize>(), kind in 0..6u8
    ) {
        let output = json!({"errors":[diagnostic("info", &text)]});
        let mut bytes = serde_json::to_vec(&output).unwrap();
        match kind {
            0 => {
                bytes.truncate(cut % bytes.len());
            }
            1 => bytes.push(0),
            2 => {
                bytes = br#"{"contracts":{"C":{"C":{"metadata":""#.to_vec();
                bytes.push(octet);
                bytes.extend_from_slice(br#""}}}}"#);
            }
            3 => {
                bytes = json!({"errors":{"bad":text}, "sources":true})
                    .to_string()
                    .into_bytes()
            }
            4 => bytes.extend_from_slice(b"{}"),
            _ => {
                bytes = br#"{"futureField":""#.to_vec();
                bytes.push(octet);
                bytes.extend_from_slice(br#""}"#);
            }
        }
        prop_assert!(serde_json::from_slice::<SolcInputDescription>(&bytes).is_err());
        if kind != 5 {
            prop_assert!(serde_json::from_slice::<SolcOutput>(&bytes).is_err());
        }
        prop_assert!(matches!(
            parse_output(&bytes),
            Err(SolcError::SerializationError(_))
        ));
    }
}

#[test]
fn compiler_output_rejects_invalid_utf8_in_known_and_unknown_fields() {
    assert!(matches!(
        parse_output(b"{\"futureField\":\"\x80\"}"),
        Err(SolcError::SerializationError(_))
    ));
    assert!(matches!(
        parse_output(b"{\"contracts\":{\"C\":{\"C\":{\"metadata\":\"\xff\"}}}}"),
        Err(SolcError::SerializationError(_))
    ));
}

#[test]
fn metadata_append_cbor_uses_solc_wire_spelling() {
    let input =
        json!({"language":"Solidity","sources":{},"settings":{"metadata":{"appendCBOR":false}}});
    let typed: SolcInputDescription = serde_json::from_value(input.clone()).unwrap();
    assert_eq!(serde_json::to_value(typed).unwrap(), input);
}

#[test]
fn solc_whole_file_warning_round_trips() {
    // solc 0.8.30 emits -1 for both offsets on SPDX warning 1878.
    let mut entry = diagnostic("warning", "missing SPDX identifier");
    entry["sourceLocation"] = json!({"file":"A.sol","start":-1,"end":-1});
    let wire = json!({"errors":[entry]});
    let parsed = parse_output(&serde_json::to_vec(&wire).unwrap()).unwrap();
    assert_eq!(serde_json::to_value(parsed).unwrap(), wire);
}
