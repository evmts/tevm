# `@tevm/fuzz` — Multi-Engine Fuzz Testing Suite

TEVM's correctness suite combines **four complementary fuzzing engines** spanning TypeScript/Node.js, Effect, and Zig's native EVM/Node runtime. The bundler, `@tevm/effect`, `@tevm/logger`, `@tevm/ethers` and Rust crate fuzz suites moved with their packages to [evmts/tevm-bundler](https://github.com/evmts/tevm-bundler), [evmts/tevm-logger](https://github.com/evmts/tevm-logger) and [evmts/tevm-ethers](https://github.com/evmts/tevm-ethers):

1. **Property-Based & Stateful Model-Based Fuzzing (`fast-check` in Vitest)** — `src/*.fuzz.spec.ts`
   - `@tevm/node` (`src/engine.fuzz.spec.ts`): adversarial raw `engine.rpc`, structured JSON-RPC 2.0 single/batch envelope correlation, option boundary validation, native call/revert byte preservation, concurrent queue/event/close lifecycles.
   - Stateful EVM state machine (`src/evm-state-machine.fuzz.spec.ts`): reference-model verification of arbitrary interleaved sequences of account mutations, ETH transfers, contract deploys/calls, mining, nested `evm_snapshot`/`evm_revert`, `tevmDumpState`/`tevmLoadState` round-trips across fresh native engines, log filters, and deferred mempool mining.
   - ABI & client parity (`src/abi-memory-client.fuzz.spec.ts`): universal EVM ABI echo oracle round-tripping primitives, dynamic strings/bytes/arrays, and tuples through native ZEVM; `@tevm/contract`, `@tevm/predeploys`, and `@tevm/viem` differential parity.
   - Forking & root facade (`src/fork-and-facade.fuzz.spec.ts`): cross-process HTTP upstream fork fuzzing with local overrides and snapshot/revert isolation, `tevm` root facade parity.
   - `@tevm/server` (`src/server-protocol.fuzz.spec.ts`): `extractJsonRpcFrames` chunk-splitting invariance, `getRequestBody` UTF-8 split & `maxBodySize` enforcement, real loopback HTTP/WebSocket/IPC fuzzing, stateful `createRpcConnection` subscription lifecycles.
   - `@tevm/jsonrpc`, `@tevm/http-client`, `@tevm/errors`, `@tevm/utils`, `@tevm/common` (`src/jsonrpc-http-errors.fuzz.spec.ts`).
   - `@tevm/mcp` (`src/mcp.fuzz.spec.ts`): `toJsonValue` total JSON-serializability, adversarial tool names, schema fuzzing, trace truncation bounds, stateful MCP sessions.
2. **Effect Feedback-Guided Fuzzing & Deterministic Fiber Simulation (`@smthrs/fuzz` + `effect@4.1.1`)** — `src/effect-feedback.fuzz.spec.ts`
   - AFL++ fast energy scheduling over `Fuzz.observe` / `Fuzz.score` and `FuzzSimulation.execution()` preemptive fiber interleaving simulation.
3. **Coverage-Guided Native LibFuzzer for Node.js (`@jazzer.js/core`)** — `jazzer/*.fuzz.mjs` (5 targets)
   - V8/JS bytecode-instrumented libFuzzer targets (`ipc-framing`, `request-body`, `mcp-tools`, `jsonrpc-fetcher`, `zevm-rpc`) with committed seed files under `__fuzz__/jazzer/` and ephemeral mutated corpora cached in `node_modules/.cache/jazzer-corpus/`.
4. **Native Linux Zig Coverage-Guided Fuzzing (`std.testing.fuzz --fuzz`)**
   - `scripts/fuzz/run-zig-fuzz-remote.mjs` runs Zig's native Linux coverage-guided fuzzer locally on Linux or remotely on bare-metal Ubuntu Latitude hosts (`TEVM_ZIG_FUZZ_HOST`, default `nyc-01`) with the pinned Zig toolchain from `mise.toml`.

## Commands

```bash
pnpm fuzz                  # Run TS/Effect/Jazzer.js fuzz campaign
pnpm fuzz:intensive        # Extended campaign (higher runs, executions, and durations)
pnpm fuzz:jazzer           # Run Jazzer.js native LibFuzzer targets
pnpm fuzz:effect           # Run @smthrs/fuzz feedback-guided + FuzzSimulation suite
pnpm fuzz:zig              # Run Zig --fuzz on Linux or remote Ubuntu Latitude server

# Incremental Flows / Smithers targets (fine-grained dependency slices)
pnpm exec smthrs target //test/fuzz:testNode
pnpm exec smthrs target //test/fuzz:testClient
pnpm exec smthrs target //test/fuzz:testServer
pnpm exec smthrs target //test/fuzz:testMcp
pnpm exec smthrs target //test/fuzz:effectFuzz
pnpm exec smthrs target //test/fuzz:jazzer
pnpm exec smthrs target //:fuzz
```
