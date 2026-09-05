# @tevm/node

A serialized native ZEVM engine with JSON-RPC and an event emitter. Execution and node state live in the Zig runtime, backed by Voltaire and Guillotine Mini.

```js
import { createZevmEngine } from '@tevm/node'
const engine = createZevmEngine()
try {
  console.log(await engine.request({ method: 'eth_chainId' }))
} finally {
  await engine.close()
}
```

`rpc` accepts raw JSON including batches and notifications. `request` throws `NativeRpcError` with the native code and data. Events are `request`, `response`, `block`, and `close`. Close releases the native handle. See the [migration guide](../../docs/native-engine-migration.md) for configuration and native build requirements.

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
