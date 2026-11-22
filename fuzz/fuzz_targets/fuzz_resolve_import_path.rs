#![no_main]

use libfuzzer_sys::fuzz_target;
use std::path::PathBuf;
use tevm_resolutions_rs::{resolve_import_path, Config};

fuzz_target!(|data: &[u8]| {
    if let Ok(import_path) = std::str::from_utf8(data) {
        let cfg = Config::from((
            Some(vec![]),
            Some(vec![
                ("@openzeppelin/".to_string(), "/lib/oz".to_string()),
                ("forge-std/".to_string(), "/lib/forge-std/src".to_string()),
            ]),
        ));
        let _ = resolve_import_path(PathBuf::from("/workspace/src/Main.sol"), import_path, &cfg);
    }
});
