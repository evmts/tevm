use foundry_compilers::artifacts::Contract;
use serde_json::json;
use std::time::{Duration, Instant};
use tevm_runtime_rs::{generate_runtime, ContractPackage, ModuleType};

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
    let contract_json = json!({
        "abi": [
            {"type":"function","name":"balanceOf","inputs":[{"name":"owner","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"},
            {"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"},
            {"type":"event","name":"Transfer","anonymous":false,"inputs":[{"name":"from","type":"address","indexed":true},{"name":"to","type":"address","indexed":true},{"name":"value","type":"uint256","indexed":false}]}
        ],
        "evm": {
            "bytecode": { "object": "608060405260043610" },
            "deployedBytecode": { "object": "608060405260043610" }
        }
    });
    let contract: Contract = serde_json::from_value(contract_json).expect("contract");

    let b1 = run_bench("@tevm/runtime-rs", "generate_runtime (mjs with bytecode)", || {
        let out = generate_runtime(
            vec![("ERC20".to_string(), contract.clone())],
            ModuleType::Mjs,
            ContractPackage::TevmContract,
            true,
        );
        assert!(out.contains("createContract"));
    });

    let b2 = run_bench("@tevm/runtime-rs", "generate_runtime (dts declarations)", || {
        let out = generate_runtime(
            vec![("ERC20".to_string(), contract.clone())],
            ModuleType::Dts,
            ContractPackage::TevmContract,
            true,
        );
        assert!(out.contains("ERC20"));
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
