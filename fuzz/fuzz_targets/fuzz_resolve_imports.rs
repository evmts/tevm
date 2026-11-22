#![no_main]

use libfuzzer_sys::fuzz_target;
use std::path::PathBuf;
use tevm_resolutions_rs::{resolve_imports, Config};

fuzz_target!(|data: &[u8]| {
    if let Ok(code) = std::str::from_utf8(data) {
        let cfg = Config::from((Some(vec![]), Some(vec![])));
        let _ = resolve_imports(&PathBuf::from("/tmp/tevm-fuzz/Main.sol"), code, &cfg);
    }
});
