**@tevm/node**

***

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

`rpc` accepts raw JSON including batches and notifications. `request` throws `NativeRpcError` with the native code and data. Events are `request`, `response`, `block`, and `close`. Close releases the native handle. See the [migration guide](_media/native-engine-migration.md) for configuration and native build requirements.
