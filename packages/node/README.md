# @tevm/node

A thin serialized JSON-RPC wrapper around [ZEVM](https://github.com/evmts/zevm) with pluggable native and WASM EVM backend support. By default it delegates execution and node state to `@evmts/zevm`'s `NativeNode` (Voltaire + Guillotine Mini), or accepts any `{ rpc(json), close() }` sync/async `backend` (such as a WASM-based EVM) without loading native bindings or any Node built-in.

```js
import { createZevmEngine } from '@tevm/node'

// Default: native ZEVM Node-API backend
const engine = createZevmEngine()
try {
	console.log(await engine.request({ method: 'eth_chainId' }))
} finally {
	await engine.close()
}

// Pluggable: WASM EVM or custom JSON-RPC backend (never loads @evmts/zevm native addon)
const wasmEngine = createZevmEngine({
	backend: {
		rpc: async (json) => wasmInstance.rpc(json),
		close: () => wasmInstance.free(),
	},
})
```

`rpc` accepts raw JSON including batches and notifications. `request` throws `NativeRpcError` with the backend code and data, and rejects with a `TypeError` when the request is not an object with a string `method`. Close releases the underlying native or WASM handle. See the [migration guide](../../docs/native-engine-migration.md) for configuration and native build requirements.

`request` writes `jsonrpc` and `id` itself. A backend reply must be a JSON-RPC 2.0 response whose `id` matches the request; anything else rejects as a transport fault, not a `NativeRpcError`.

## Options

| Option       | Type                                                              | Behavior                                                                                                                  |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `chainId`    | `number`                                                          | Chain ID of the node. Defaults to `common.id`, then 31337.                                                                |
| `common`     | `{ id: number }`                                                  | Chain definition. `chainId` and `common.id` must be equal when both are given; a conflict throws.                         |
| `mining`     | `{ auto?: boolean; interval?: number }`                           | Automine defaults to `true`. `interval` is whole seconds; `0` disables the timer.                                         |
| `fork`       | `{ url: string; blockNumber?: number }`                           | Fork upstream state. Pin `blockNumber` for stable reads.                                                                  |
| `backend`    | `{ rpc(json), close() }`                                          | Custom JSON-RPC backend that replaces `@evmts/zevm`. Mutually exclusive with `wasm`.                                      |
| `wasm`       | `boolean \| ArrayBuffer \| ArrayBufferView \| WebAssembly.Module` | Force `@evmts/zevm/browser`'s compiled WASM backend (`true` or bytes/module), or disable auto-WASM in browsers (`false`). |
| `consoleLog` | `boolean \| (message, raw) => void`                               | Print Solidity `console.log` output. Disabled by default.                                                                 |

With an injected `backend`, the backend owns its chain ID. When `chainId` or `common` is also given, the engine calls `eth_chainId` during initialization and `ready()` rejects on a mismatch. A backend without `eth_chainId` (`-32601`) is not checked.

## Events

`engine.events` is a zero-dependency emitter with `on`, `once`, `off`, `removeListener`, `removeAllListeners`, `emit` and `listenerCount`. It is not a `node:events` `EventEmitter`.

| Event        | Payload                                  | Emitted                                                                           |
| ------------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `request`    | `{ method, params? }`                    | Before each `request()` dispatch.                                                 |
| `response`   | `{ request, result }`                    | After each successful `request()`.                                                |
| `block`      | `eth_getBlockByNumber` result            | For each block mined after the listener subscribed.                               |
| `consoleLog` | `{ message, signature, calldata, args }` | For each decoded Solidity `console.log` call. Requires `consoleLog`.              |
| `error`      | the thrown value                         | When observer work fails. See below.                                              |
| `close`      | none                                     | Once, when the engine closes or initialization fails. Listeners are then removed. |

Listeners are observers. A throwing listener, a throwing `consoleLog` handler, a failed console log drain and a failed block fetch never replace an RPC result and never mask a revert error. The failure is emitted as an `error` event, and dropped when there is no `error` listener. A listener or `consoleLog` handler that returns a rejecting promise is reported the same way and never causes an unhandled rejection. `request` and `response` listeners receive copies of the payload: mutating one changes neither the dispatched request nor the caller's result.

A backend response must be JSON-RPC 2.0 with exactly one of `result` and `error`, and `error` must be an object with an integer `code` and a string `message`. Anything else rejects the request as a transport fault instead of a `NativeRpcError`.

While a `block` listener is subscribed, the engine polls every 50 ms and runs at most one poll at a time. A block that the backend reports as `null` is retried by the next poll. When more than 64 blocks appear between two polls, only the tip block is emitted.

## Solidity `console.log`

```js
const engine = createZevmEngine({
	// `true` prints with console.log. A function receives each message instead.
	consoleLog: (message, { calldata, args }) => console.log(`[sol] ${message}`),
})
engine.events.on('consoleLog', ({ message, signature, calldata, args }) => {
	// signature: 'log(string,uint256)', args: ['balance: %d', 42n], message: 'balance: 42'
})
engine.events.on('error', (error) => console.error('observer failed', error))
```

The engine drains captured calls with `tevm_drainConsoleLogs` after `eth_call`, `eth_estimateGas`, `eth_sendTransaction` and `eth_sendRawTransaction`, through both `request` and `rpc`, and also after a reverted call. Messages follow Node's `util.format`: `%s`, `%d`, `%i`, `%f`, `%o` and `%%`. A backend without `tevm_drainConsoleLogs` produces no messages.

## Browsers and WASM

`@tevm/node` has no static Node built-in import and bundles cleanly with `platform: 'browser'`.

- **Zero-config in browsers and workers**: when `@evmts/zevm` is installed, calling `createZevmEngine()` outside Node.js automatically loads `@evmts/zevm/browser`'s compiled `zevm.wasm` reactor during initialization:

```js
import { createZevmEngine } from '@tevm/node'

// Works with zero configuration in browsers (WASM) and Node.js (native Node-API)
const engine = createZevmEngine({ chainId: 31337 })
try {
	console.log(await engine.request({ method: 'eth_chainId' }))
} finally {
	await engine.close()
}
```

- **Explicit WASM anywhere (Node.js, Bun, Deno, Cloudflare Workers, custom asset URLs)**: pass `wasm` bytes or a compiled `WebAssembly.Module`, or build a backend directly with `createWasmBackend`:

```js
import { createWasmBackend, createZevmEngine } from '@tevm/node'

// Option 1: pass pre-loaded WASM bytes or a WebAssembly.Module directly
const engine = createZevmEngine({ wasm: wasmBytes })

// Option 2: construct the reusable ZevmBackend explicitly
const backend = await createWasmBackend({ chainId: 31337, wasm: wasmBytes })
const customEngine = createZevmEngine({ backend, chainId: 31337 })
```

- **Custom JSON-RPC backend**: pass any `{ rpc(json), close() }` object without loading `@evmts/zevm` at all:

```js
import { createZevmEngine } from '@tevm/node'

const engine = createZevmEngine({
	backend: {
		rpc: (json) => wasmNode.rpc(json), // string | null, sync or async
		close: () => wasmNode.free(),
	},
})
```

`rpc` receives one raw JSON-RPC 2.0 string (single request, batch or notification) and returns the JSON response, or `null` for a notification. The native addon `@evmts/zevm` is an optional dependency, loaded through `process.getBuiltinModule('node:module')` in Node.js (>= 22.12) when neither `backend` nor `wasm` is given. Pass `wasm: false` outside Node.js to opt out of automatic WASM loading.

## Mainnet hardfork rules

With `chainId: 1`, pending transactions follow the mainnet hardfork schedule.
From Osaka (timestamp 1764798551), a declared transaction gas limit above
16,777,216 is rejected with `NativeRpcError.code === -32000`. This applies to
submission and signing, independently of the block gas limit. Non-validating
simulations retain their simulation gas bound.

The same Osaka activation changes ModExp (`0x05`): each declared operand is
limited to 1,024 bytes and EIP-7883 pricing starts at 500 gas. Calls with
oversized operands or insufficient forwarded gas fail. Earlier pending block
contexts retain Prague behavior. These rules require the companion native addon
built from the matching Voltaire/Guillotine Mini/ZEVM source; the JavaScript
wrapper delegates execution to that addon.
