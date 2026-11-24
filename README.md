# TEVM

TEVM is a thin TypeScript/JavaScript wrapper around [ZEVM](https://github.com/evmts/zevm) and pluggable WASM-based EVM backends, exposing them through viem clients, an event emitter, and HTTP, WebSocket, and IPC JSON-RPC servers. ZEVM (powered by Voltaire primitives/state and Guillotine Mini bytecode execution) owns execution, mining, transaction admission, receipts, filters, snapshots, and fork state; TEVM stays razor-thin on top.

This checkout contains a breaking native-engine migration. Previously published JavaScript-engine releases do not implement this API. See [the migration guide](docs/native-engine-migration.md).

## Local setup

Keep these repositories beside each other:

```text
~/tevm-monorepo
~/zevm
~/voltaire
~/guillotine-mini
```

Use Node from `.nvmrc`, pnpm from `package.json`, and tools from `mise.toml`:

```sh
nvm use
mise install
pnpm install
pnpm factory:preflight
pnpm build:host
```

The install build compiles ZEVM's Node-API addon from the sibling Zig sources. `build:host` builds the native client, RPC servers, adapters, and MCP packages with clean declarations. To rebuild the addon after native changes:

```sh
mise exec -- node scripts/factory/build-native.mjs
```

By default, `createZevmEngine()` and `createMemoryClient()` load `@evmts/zevm`'s native Node-API addon. To plug in a **WASM-based EVM** (such as a ZEVM WASM build) or any custom JSON-RPC runtime without loading native bindings, pass a minimal `backend` implementing `{ rpc(json), close() }` (sync or async):

```js
import { createMemoryClient } from '@tevm/memory-client'

const client = createMemoryClient({
  backend: {
    rpc: (json) => wasmEvm.rpc(json), // returns string | null | Promise<string | null>
    close: () => wasmEvm.close(),
  },
})
```

## In-memory client

```js
import { createMemoryClient } from '@tevm/memory-client'
import { parseAbi } from 'viem'

const client = createMemoryClient()
try {
  const deployed = await client.tevmDeploy({
    bytecode: '0x600a600c600039600a6000f3602a60005260206000f3',
  })
  const result = await client.tevmContract({
    address: deployed.createdAddress,
    abi: parseAbi(['function answer() view returns (uint256)']),
    functionName: 'answer',
  })
  console.log(result.data) // 42n
} finally {
  await client.tevmClose()
}
```

Viem public, wallet, and test actions are attached to the client. Calls use the native JSON-RPC implementation; supported methods and error behavior follow ZEVM. The default chain ID is 31337. Each client creates isolated native state unless given an existing engine.

## Engine and events

```js
import { createZevmEngine } from '@tevm/node'

const engine = createZevmEngine({ mining: { auto: false } })
engine.events.on('block', (block) => console.log(block.number))
try {
  await engine.request({ method: 'evm_mine' })
  console.log(await engine.rpc('{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"}'))
} finally {
  await engine.close()
}
```

`request` returns a JSON result and throws `NativeRpcError` with the native `code` and `data`. `rpc` returns the exact response JSON, or `null` for notifications. Requests are serialized. The wrapper emits `request`, `response`, `block`, and `close`; block listeners also observe native interval mining.

## JSON-RPC server

```sh
pnpm native:server
```

This starts HTTP and WebSocket on `127.0.0.1:8545`. Browsers can connect to this server with viem's `http` or `webSocket` transport, or run in-process by plugging a WASM EVM `backend` into `createZevmEngine` / `createMemoryClient`.

```js
import { createMemoryClient } from '@tevm/memory-client'
import { createServer, createIpcServer } from '@tevm/server'

const client = createMemoryClient()
await client.tevmReady()
const server = createServer(client)
server.listen(8545, '127.0.0.1')
const ipc = createIpcServer(client)
ipc.listen('/tmp/tevm.sock')
process.once('SIGINT', () => {
  ipc.close()
  server.close(() => { void client.tevmClose() })
})
```

WebSocket and IPC subscriptions use native block, log, and pending-transaction filters. HTTP passes batches, notifications, and JSON-RPC errors through the native dispatcher.

## Repository map

This repository holds the native engine host: `packages/*`, `extensions/viem`, the `tevm` facade, `cli/`, the docs sites, and the conformance and fuzz suites. Everything else lives in a standalone repository. Send issues and pull requests for those packages there.

| Code | Canonical repository |
| --- | --- |
| Bundler plugins (`@tevm/vite-plugin`, `esbuild`, `rollup`, `rspack`, `webpack`, `bun`, `requirejs`, `unplugin`), `@tevm/base-bundler`, `@tevm/bundler-cache`, `@tevm/compiler`, `@tevm/config`, `@tevm/resolutions`, `@tevm/runtime`, `@tevm/solc`, `@tevm/whatsabi`, the `*-rs` Rust crates, `@tevm/effect`, `@tevm/lsp`, `@tevm/ts-plugin`, the VS Code extension | [evmts/tevm-bundler](https://github.com/evmts/tevm-bundler) |
| `@tevm/test-utils`, `@tevm/test-matchers`, `@tevm/test-node` | [evmts/tevm-test](https://github.com/evmts/tevm-test) |
| `@tevm/contract` | [evmts/tevm-contract](https://github.com/evmts/tevm-contract) |
| `@tevm/logger` | [evmts/tevm-logger](https://github.com/evmts/tevm-logger) |
| `@tevm/cli`, `tevm-run` | [evmts/tevm-cli](https://github.com/evmts/tevm-cli) |
| `@tevm/ethers` | [evmts/tevm-ethers](https://github.com/evmts/tevm-ethers) |
| Example apps | [evmts/tevm-examples](https://github.com/evmts/tevm-examples) |

The `tevm` facade and `cli/` consume the bundler packages from the npm registry (`^1.0.0-rc.151`), so `tevm/bundler/*` keeps working without a workspace copy. This repository has no Cargo workspace. The Rust toolchain is still required because ZEVM's addon build runs `cargo` for Voltaire's Rust crypto.

### Copies still kept here

Three paths duplicate a standalone repository on purpose. Each has a removal condition.

| Path | Why it stays | Remove when |
| --- | --- | --- |
| `packages/contract` (`@tevm/contract`) | `@tevm/memory-client`, `@tevm/predeploys`, `cli/` and the `tevm` facade depend on it through `workspace:^`. The registry copy (`1.0.0-rc.151`) predates the overload and anonymous-event fixes and resolves the registry `@tevm/utils` and `@tevm/errors` `rc.151`, which do not match the native packages here ([#2097](https://github.com/evmts/tevm/issues/2097)). | evmts/tevm-contract publishes a release that contains those fixes and this repository publishes `@tevm/utils` and `@tevm/errors` at a version that release accepts. Then replace `workspace:^` with the registry range and delete the directory. |
| `cli/` (`@tevm/cli`) | It is the only CLI written against the native engine (`@tevm/server`, `tevmMine({ blocks })`, `tevmSetAccount({ storage })`). The `tevm` binary imports it. evmts/tevm-cli still targets the published JavaScript-engine API and did not port this code. | The native `@tevm/actions`, `@tevm/memory-client` and `@tevm/server` are published and evmts/tevm-cli ports this directory against them. |
| `test/vitest-matchers/utils.ts` | `packages/contract/vitest.config.ts` loads it as a setup file. It is one file, not the `@tevm/test-matchers` package. | `packages/contract` is removed. |

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository gates and [AGENTS.md](AGENTS.md) for the contributor contract.
