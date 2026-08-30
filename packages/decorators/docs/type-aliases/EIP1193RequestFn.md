[**@tevm/decorators**](../README.md)

***

[@tevm/decorators](../globals.md) / EIP1193RequestFn

# Type Alias: EIP1193RequestFn\<TRpcSchema\>

> **EIP1193RequestFn**\<`TRpcSchema`\> = `TypedEIP1193RequestFn`\<`TRpcSchema`\> & (`args`, `options?`) => `Promise`\<`unknown`\>

Defined in: [eip1193/EIP1993RequestFn.ts:41](https://github.com/evmts/tevm/blob/main/packages/decorators/src/eip1193/EIP1993RequestFn.ts#L41)

An EIP-1193 request function with schema-aware Tevm overloads and an open
fallback compatible with providers such as Ethers' `Eip1193Provider`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRpcSchema` *extends* [`RpcSchema`](RpcSchema.md) \| `undefined` | `undefined` |

## Example

```typescript
import { createMemoryClient } from 'tevm'
import { BrowserProvider } from 'ethers'

const client = createMemoryClient()
const provider = new BrowserProvider(client)
const blockNumber = await client.request({ method: 'eth_blockNumber' })
```
