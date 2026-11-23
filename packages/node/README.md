# @tevm/node

A thin serialized JSON-RPC wrapper around [ZEVM](https://github.com/evmts/zevm) with pluggable native and WASM EVM backend support. By default it delegates execution and node state to `@evmts/zevm`'s `NativeNode` (Voltaire + Guillotine Mini), or accepts any `{ rpc(json), close() }` sync/async `backend` (such as a WASM-based EVM) without loading native bindings.

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

`rpc` accepts raw JSON including batches and notifications. `request` throws `NativeRpcError` with the backend code and data. Events are `request`, `response`, `block`, and `close`. Close releases the underlying native or WASM handle. See the [migration guide](../../docs/native-engine-migration.md) for configuration and native build requirements.

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
