# tevm one-shot LLM evals

This suite measures whether one model prompt can produce working code for real tevm tasks. It contains 22 cases against `tevm@1.0.0-rc.151`. Every case has a prompt, declared starting fixtures, and a deterministic checker that executes the candidate. No score comes from the model judging itself.

## Run

Install the pinned evaluator dependencies once:

```sh
npm install --prefix evals --ignore-scripts
```

Run every case against a real Codex model and write the machine-readable report:

```sh
npm --prefix evals run eval -- --model=gpt-5.6-sol --concurrency=2 --output=results/latest.json
```

The command prints one `PASS` or `FAIL` line per case and exits non-zero if any case misses. A non-zero exit is a valid scored run, not a runner failure. Set `RPC_URL` to an archive-capable Ethereum endpoint if the default public endpoint is unavailable. Mainnet cases fork block `20,000,000`.

## Recorded run

`results/gpt-5.6-sol-2026-07-27.json` is the first real scored run: `gpt-5.6-sol` passed 19 of 22 cases (86.4%). All three misses were the pinned mainnet fork cases, which fail inside tevm on a KZG-uninitialized 4844 blob transaction.

Useful focused commands:

```sh
npm --prefix evals run check:suite
npm --prefix evals run eval -- --case=deploy-source-read --model=gpt-5.6-sol
```

Candidate workspaces are retained under `evals/.runs/` as audit scratch so failures can be diagnosed. They are not suite inputs. `evals/node_modules/` is installation scratch. Both may be left in a shared checkout and are listed here intentionally.

If a checker bug is corrected, rescore the retained candidates without giving the model another attempt:

```sh
npm --prefix evals run rescore -- results/latest.json
```

## Case format

`suite.jsonl` has one JSON object per case:

- `prompt` is the complete task-specific prompt.
- `fixtures` lists files copied into the clean candidate directory in addition to `fixtures/_base`.
- `checker` names a case-specific Node script that exits zero only when the produced code runs and satisfies the assertions.
- `difficulty` is descriptive metadata. Hard cases provide intentional headroom.

Checkers also require task-relevant tevm API usage in source. This prevents a candidate from passing by printing the expected value without executing tevm.
