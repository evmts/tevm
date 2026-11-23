[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / createMemoryClient

# Function: createMemoryClient()

> **createMemoryClient**(`options?`): [`MemoryClient`](../type-aliases/MemoryClient.md)

Defined in: [packages/memory-client/src/createMemoryClient.js:20](https://github.com/evmts/tevm/blob/main/packages/memory-client/src/createMemoryClient.js#L20)

Create a viem client backed by native ZEVM, Voltaire and Guillotine Mini.
The engine owns execution, state, transactions, mining, filters and tracing.
`client.chain` is `common`, or Foundry's chain with `chainId` applied. With an injected
`backend` or `engine` and neither `common` nor `chainId`, `client.chain` is `undefined`
and viem reads the ID with `eth_chainId`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`MemoryClientOptions`](../type-aliases/MemoryClientOptions.md) | - |

## Returns

[`MemoryClient`](../type-aliases/MemoryClient.md)

## Example

```ts
import { createMemoryClient } from '@tevm/memory-client'
const client = createMemoryClient()
console.log(await client.getBlockNumber())
await client.tevmClose()
```
