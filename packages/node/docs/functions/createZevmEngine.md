[**@tevm/node**](../README.md)

***

[@tevm/node](../globals.md) / createZevmEngine

# Function: createZevmEngine()

> **createZevmEngine**(`options?`): [`ZevmEngine`](../type-aliases/ZevmEngine.md)

Defined in: packages/node/src/createZevmEngine.js:17

Create an isolated native ZEVM engine with serialized JSON-RPC and events.
Voltaire owns state and primitives; Guillotine Mini executes bytecode.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ZevmEngineOptions`](../type-aliases/ZevmEngineOptions.md) | - |

## Returns

[`ZevmEngine`](../type-aliases/ZevmEngine.md)

## Throws

If the native addon is unavailable or configuration is invalid.

## Example

```ts
import { createZevmEngine } from '@tevm/node'
const engine = createZevmEngine({ chainId: 31337 })
console.log(await engine.request({ method: 'eth_blockNumber' }))
await engine.close()
```
