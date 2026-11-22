#![no_main]

use libfuzzer_sys::fuzz_target;
use tevm_solc_rs::models::{SolcErrorEntry, SolcInputDescription};

fuzz_target!(|data: &[u8]| {
    if let Ok(text) = std::str::from_utf8(data) {
        if let Ok(desc) = serde_json::from_str::<SolcInputDescription>(text) {
            let encoded = serde_json::to_string(&desc).expect("re-serialize SolcInputDescription");
            let reparsed: SolcInputDescription =
                serde_json::from_str(&encoded).expect("re-parse SolcInputDescription");
            assert_eq!(desc, reparsed);
        }
        let _ = serde_json::from_str::<SolcErrorEntry>(text);
    }
});
