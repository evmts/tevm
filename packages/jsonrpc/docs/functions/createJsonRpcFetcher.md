[**@tevm/jsonrpc**](../README.md)

***

[@tevm/jsonrpc](../globals.md) / createJsonRpcFetcher

# ~~Function: createJsonRpcFetcher()~~

> **createJsonRpcFetcher**(`client`): [`JsonRpcClient`](../type-aliases/JsonRpcClient.md)

Defined in: [packages/jsonrpc/src/createJsonRpcFetcher.js:33](https://github.com/evmts/tevm/blob/main/packages/jsonrpc/src/createJsonRpcFetcher.js#L33)

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | \{ `request`: `EIP1193RequestFn`\<`undefined`, `false`\>; \} | - |
| `client.request` | `EIP1193RequestFn`\<`undefined`, `false`\> | - |

## Returns

[`JsonRpcClient`](../type-aliases/JsonRpcClient.md)

Client returning the full JSON-RPC response

## Deprecated

Adapts a viem client to return JSON-RPC envelopes. Provider failures retain integer codes and messages. Diagnostic bigints use decimal strings. Unserializable data is omitted.
Used currently as an adapter to avoid refactoring existing code

## See

https://ethereum.org/en/developers/docs/apis/json-rpc/

## Example

```typescript
import { createJsonRpcFetcher } from '@tevm/jsonrpc'
import { createPublicClient, custom } from 'viem'

const client = createPublicClient({ transport: custom({ request: async () => '0x0' }) })
const fetcher = createJsonRpcFetcher(client)
const response = await fetcher.request({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
```
