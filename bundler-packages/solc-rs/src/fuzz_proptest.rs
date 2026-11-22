use crate::models::{
    SolcErrorEntry, SolcInputDescription, SolcInputSource, SolcLanguage, SolcOptimizer,
    SolcSettings, SolcSourceLocation,
};
use proptest::prelude::*;
use std::collections::HashMap;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(256))]

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
                start,
                end,
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
        let parsed: SolcErrorEntry = serde_json::from_str(&serialized).expect("deserialize SolcErrorEntry");
        prop_assert_eq!(parsed, entry);
    }
}
