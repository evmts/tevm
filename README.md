# TEVM

TEVM embeds the native ZEVM node in Node.js and exposes it through viem clients, an event emitter, and HTTP, WebSocket, and IPC JSON-RPC servers. ZEVM owns execution, mining, transaction admission, receipts, filters, snapshots, and fork state. It uses Voltaire primitives/state and Guillotine Mini bytecode execution.

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

There is no alternate engine fallback. Local builds use the sibling source; published clients require ZEVM native platform packages. A missing native addon is an error.

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

This starts HTTP and WebSocket on `127.0.0.1:8545`. Browsers connect to this server with viem's `http` or `webSocket` transport. The native addon is not a browser WASM engine.

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

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository gates and [AGENTS.md](AGENTS.md) for the contributor contract.
