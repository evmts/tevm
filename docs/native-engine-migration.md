# Native engine migration

TEVM now wraps ZEVM's `NodeRuntime` through a C ABI and Node-API addon. The old npm package that re-exported EthereumJS has been removed. Local builds resolve `../zevm`, `../voltaire`, and `../guillotine-mini`; they do not download another engine implementation.

## Ownership

| Layer | Responsibility |
| --- | --- |
| Guillotine Mini | EVM bytecode execution |
| Voltaire | Ethereum primitives, crypto, state and supporting libraries |
| ZEVM | Node runtime, chain, mempool, mining, fork backend, RPC dispatcher |
| `@tevm/node` | Serialized native handle, lifecycle, errors and events |
| `@tevm/memory-client` | Viem transport and ABI/account convenience actions |
| `@tevm/server` | HTTP, WebSocket and IPC delivery, subscription connections |

The native bindings in ZEVM are C and JavaScript. They contain no TypeScript implementation or EthereumJS dependency. TEVM retains TypeScript declarations and JSDoc for its public host API.

See [local validation results and unresolved gates](native-engine-validation.md) before treating this checkout as release-qualified.

## Public API changes

- Create an engine with `createZevmEngine`; `createTevmNode` is an alias. It exposes `request`, `rpc`, `events`, `ready`, and `close`.
- `createMemoryClient` creates isolated native state. `client.transport.tevm` is its engine. Call `tevmClose` when finished; this also closes an explicitly supplied engine.
- `common` accepts a viem `Chain`. Use `chainId` to configure native identity. A chain object does not install a custom hardfork schedule.
- Mining configuration is `{ mining: { auto: false, interval: 1 } }`. Interval values are seconds. `tevmMine({ blocks: 2, interval: 1 })` mines explicit blocks.
- Fork configuration is `{ fork: { url, blockNumber } }`; block numbers are optional safe integers. ZEVM forks upstream state into a new local chain starting at block zero; upstream block headers/history are not imported. Pin `blockNumber` for repeatable upstream state. Fork HTTP runs synchronously in native code. An upstream used in tests must run in a separate process, rather than on the same JavaScript event loop.
- `tevmCall` returns `rawData`, and transaction submissions return `txHash` plus an optional native receipt. `tevmContract` additionally ABI-decodes `data`; `tevmDeploy` exposes `createdAddress` once mined.
- Native JSON-RPC quantities are hexadecimal strings. Host account helpers convert balances/nonces to bigint. Errors throw with native negative RPC codes, or code 3 and revert data for execution reverts.
- `tevmSetAccount` calls native setters for supplied balance, nonce, code, and storage. A multi-field update is not atomic; use a snapshot if rollback is needed.
- Dump/load uses ZEVM's opaque hexadecimal state blob. Old JavaScript account-map dumps and version-1 CLI sessions are incompatible. CLI sessions now use version 2.
- The remote HTTP client exposes convenience methods as `client.tevm.call`, `contract`, `deploy`, `getAccount`, `setAccount`, `mine`, `deal`, `dumpState`, and `loadState`.
- Ethers `TevmProvider` delegates `_send` to native RPC; its `tevm` property is the memory client.

## Removed surfaces

The JavaScript VM, EVM, state manager, trie, blockchain, transaction classes, txpool, receipt manager, consensus, procedure dispatch, and decorator packages have been removed, along with their facade exports. There are no `getVm`, `getStateManager`, `getTxPool`, mutable internal objects, or JavaScript opcode/precompile callbacks.

The former in-browser memory engine is removed. Browser examples use viem against a local native JSON-RPC server. A native WASM execution adapter is not implemented by this migration. Solidity compilation and ABI tooling remain.

The MUD adapter, matchers, and old benchmark/reproduction projects built around removed internal objects were retired. Native contract calls, deployment, transactions, receipts, mining, account/state editing, snapshots, filters and server subscriptions remain available. Debug/tracing and other RPC methods are implemented by ZEVM; a viem action's presence is not a claim that ZEVM supports every possible method or parameter extension.

Conformance scripts now invoke Guillotine Mini's native fixture targets. There is no JavaScript execution oracle in the TEVM test runner. Existing fixture evidence must be rerun before claiming parity across hardforks.

## Native development

```sh
cd ~/zevm
zig build dependency-preflight -- --zig-version 0.15.2
zig build npm-smoke -Doptimize=ReleaseSafe
cd ~/tevm-monorepo
mise exec -- node scripts/factory/build-native.mjs
pnpm --dir packages/node exec vitest run --coverage
pnpm --dir packages/memory-client exec vitest run --coverage
pnpm --dir packages/server exec vitest run --coverage
```

The install/build process keeps Flows at its existing pinned submodule revision. Native sibling worktrees are intentionally built including local edits; changing a sibling requires rebuilding the addon. No source changes are committed or published by these commands.

`debug_traceCall` now records native Guillotine Mini opcode traces, including
pre-op stack/memory and revert output. It supports boolean `disableStack`,
`enableMemory`, `enableReturnData`, and `disableStorage: true`; custom tracer
programs and transaction replay tracing are not supported. The native response
retains at most 100,000 steps and marks truncation.

MCP tools use the same engine. Pending deployment reports the predicted native
contract address and `gasLimit`; call/send tools report `estimatedGas`. Event logs
and actual gas usage are read from mined receipts. Closing or expiring sessions
releases their native handles.

The old Next.js browser fork/state editor and MUD/custom-precompile examples were retired. The playground and Vite example connect to the native HTTP server. `@tevm/actions` and `@tevm/viem` now contain browser-safe RPC helpers; embedded transports live in `@tevm/memory-client`.
