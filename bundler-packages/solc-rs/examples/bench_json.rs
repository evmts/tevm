use serde_json::json;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tevm_solc_rs::{SolcInputDescription, SolcInputSource, SolcLanguage, SolcOutput, SolcSettings};

// Approximate two-sided 95% margin of error, as a percentage of the mean.
fn relative_margin_of_error(samples: &[f64], mean: f64) -> f64 {
    let n = samples.len() as f64;
    if n < 2.0 || mean == 0.0 {
        return 0.0;
    }
    let variance = samples.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0);
    100.0 * 1.96 * (variance / n).sqrt() / mean
}

fn run_bench<F: FnMut()>(suite: &str, name: &str, mut f: F) -> serde_json::Value {
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
        "rme": relative_margin_of_error(&samples_ms, mean_ms),
        "samples": n,
    })
}

fn main() {
    let mut sources = HashMap::new();
    sources.insert(
        "Counter.sol".to_string(),
        SolcInputSource {
            content: Some("pragma solidity ^0.8.20;\ncontract Counter { uint256 public count; }\n".to_string()),
            urls: None,
            keccak256: None,
        },
    );
    let input = SolcInputDescription {
        language: SolcLanguage::Solidity,
        sources,
        settings: Some(SolcSettings::default()),
    };

    let sample_output = json!({
        "contracts": {
            "Counter.sol": {
                "Counter": {
                    "abi": [{"type":"function","name":"count","inputs":[],"outputs":[{"type":"uint256"}]}],
                    "evm": {
                        "bytecode": { "object": "6080604052" },
                        "deployedBytecode": { "object": "6080604052" }
                    }
                }
            }
        },
        "sources": {}
    })
    .to_string();

    let b1 = run_bench("@tevm/solc-rs", "SolcInputDescription JSON serialize", || {
        let s = serde_json::to_string(&input).expect("serialize");
        assert!(s.contains("Counter.sol"));
    });

    let b2 = run_bench("@tevm/solc-rs", "SolcOutput JSON deserialize", || {
        let out: SolcOutput = serde_json::from_str(&sample_output).expect("deserialize");
        assert!(out.contracts.is_some());
    });

    println!("{}", json!({ "benchmarks": [b1, b2] }));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rme_uses_sample_variance_and_standard_error() {
        // Four values with mean 2 and sample standard deviation 1.
        let samples = [1.5, 1.5, 1.5, 3.5];
        assert!((relative_margin_of_error(&samples, 2.0) - 49.0).abs() < 1e-10);
        assert_eq!(relative_margin_of_error(&[2.0; 10], 2.0), 0.0);
        assert_eq!(relative_margin_of_error(&[0.0; 10], 0.0), 0.0);
    }
}
