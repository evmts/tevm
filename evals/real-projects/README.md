# Real-project SDK evals

This suite asks Smithers to one-shot typed SDKs for six shipped Ethereum
projects. Each case receives only contract addresses, ABIs, and an SDK spec.
The hidden checker then imports the generated `sdk.ts` and runs it against a
Tevm fork of Ethereum mainnet at block `19,000,000`.

The cases use the parent eval suite's pinned `tevm`, `viem`, TypeScript, and
runner conventions. Candidate workspaces are retained under `.runs/` for
audit. Checkers are never copied into those workspaces.

Run suite validation:

```sh
node evals/real-projects/validate-suite.mjs
```

Run all Smithers cases and retain a machine-readable report:

```sh
node evals/real-projects/runner.mjs \
  --output=results/gpt-5.6-sol-2026-07-28.json
```

Use `--case=ens,uniswap-v3` to select cases. A non-zero exit means at least one
SDK failed its hidden checker and is a valid scored result. The runner uses the
first URL in `TEVM_RPC_URLS_MAINNET`, applies explicit RPC timeouts, and records
rate-limit or transport failures instead of retrying indefinitely.

## Rescoring retained candidates

`runner.mjs` scores a case only when it launches the worker itself. The
2026-07-28 run needed manual relaunches after Smithers admissions exited zero
without starting a worker, so the attempt counts and run ids for that run live
in `results/candidate-manifest.json`. `score-candidates.mjs` replays the hidden
checkers over the retained `.runs/` workspaces named by that manifest and writes
the scored report:

```sh
node evals/real-projects/score-candidates.mjs \
  results/candidate-manifest.json results/gpt-5.6-sol-2026-07-28.json
```

The manifest records only launch bookkeeping (workdir, attempts, run id). Every
pass or fail in the report comes from re-executing the checkers against a live
Tevm fork, so the scoring step is reproducible and cannot inflate a result.

## Report

Both `runner.mjs` and `score-candidates.mjs` emit the same report schema, so
either output renders:

```sh
node evals/real-projects/generate-report.mjs \
  results/gpt-5.6-sol-2026-07-28.json \
  /Users/williamcory/Tevm-Ops/Research/real-project-evals-2026-07-28/report.html
```

`passed` counts one-shot successes only. `eventualPassed` counts SDKs that pass
the hidden checker regardless of how many stack attempts they needed. The
headline number is the one-shot rate.

