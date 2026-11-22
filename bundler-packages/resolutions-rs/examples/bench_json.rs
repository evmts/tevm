use serde_json::json;
use std::time::{Duration, Instant};
use tevm_resolutions_rs::{resolve_imports, Config};

fn run_bench<F: FnMut()>(suite: &str, name: &str, mut f: F) -> serde_json::Value {
    // Warmup
    let warm_end = Instant::now() + Duration::from_millis(40);
    while Instant::now() < warm_end {
        f();
    }
    let mut samples_ms: Vec<f64> = Vec::new();
    let deadline = Instant::now() + Duration::from_millis(200);
    while Instant::now() < deadline || samples_ms.len() < 10 {
        let t0 = Instant::now();
        f();
        samples_ms.push(t0.elapsed().as_secs_f64() * 1000.0);
    }
    samples_ms.sort_by(|a, b| a.total_cmp(b));
    let n = samples_ms.len();
    let mean_ms = samples_ms.iter().sum::<f64>() / (n as f64);
    let median_ms = samples_ms[n / 2];
    let p75_ms = samples_ms[(n * 75) / 100];
    let p99_ms = samples_ms[((n * 99) / 100).min(n - 1)];
    let min_ms = samples_ms[0];
    let max_ms = samples_ms[n - 1];
    let hz = if mean_ms > 0.0 { 1000.0 / mean_ms } else { 0.0 };
    json!({
        "suite": suite,
        "name": name,
        "hz": (hz * 100.0).round() / 100.0,
        "meanMs": (mean_ms * 1_000_000.0).round() / 1_000_000.0,
        "medianMs": (median_ms * 1_000_000.0).round() / 1_000_000.0,
        "p75Ms": (p75_ms * 1_000_000.0).round() / 1_000_000.0,
        "p99Ms": (p99_ms * 1_000_000.0).round() / 1_000_000.0,
        "minMs": (min_ms * 1_000_000.0).round() / 1_000_000.0,
        "maxMs": (max_ms * 1_000_000.0).round() / 1_000_000.0,
        "rme": 0.0,
        "samples": n,
    })
}

fn main() {
    let dir = tempfile::tempdir().expect("tempdir");
    let base_path = dir.path().join("Base.sol");
    let ownable_path = dir.path().join("Ownable.sol");
    let token_path = dir.path().join("Token.sol");
    std::fs::write(&base_path, "pragma solidity ^0.8.20;\ncontract Base { uint256 public v; }\n").unwrap();
    std::fs::write(&ownable_path, "pragma solidity ^0.8.20;\nimport \"./Base.sol\";\ncontract Ownable is Base {}\n").unwrap();
    let token_code = "pragma solidity ^0.8.20;\nimport \"./Base.sol\";\nimport \"./Ownable.sol\";\ncontract Token is Ownable {}\n";
    std::fs::write(&token_path, token_code).unwrap();

    let cfg = Config::from((None::<Vec<String>>, None::<Vec<(String, String)>>));

    let b1 = run_bench("@tevm/resolutions-rs", "resolve_imports (2 relative imports)", || {
        let res = resolve_imports(&token_path, token_code, &cfg).expect("resolve_imports");
        assert_eq!(res.len(), 2);
    });

    let b2 = run_bench("@tevm/resolutions-rs", "module_factory (3-file async graph)", || {
        let mods = tevm_resolutions_rs::TOKIO
            .block_on(tevm_resolutions_rs::module_factory(
                token_path.clone(),
                token_code,
                cfg.clone(),
            ))
            .expect("module_factory");
        assert_eq!(mods.len(), 3);
    });

    println!("{}", json!({ "benchmarks": [b1, b2] }));
}
