[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / ethSendUnsignedTransactionJsonRpcProcedure

# Function: ethSendUnsignedTransactionJsonRpcProcedure()

> **ethSendUnsignedTransactionJsonRpcProcedure**(`client`): [`EthSendUnsignedTransactionJsonRpcProcedure`](../type-aliases/EthSendUnsignedTransactionJsonRpcProcedure.md)

Defined in: [packages/actions/src/eth/ethSendUnsignedTransactionProcedure.js:27](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/ethSendUnsignedTransactionProcedure.js#L27)

Request handler for `eth_sendUnsignedTransaction` JSON-RPC requests.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `TevmNode`\<`"fork"` \| `"normal"`, \{ \}\> | - |

## Returns

[`EthSendUnsignedTransactionJsonRpcProcedure`](../type-aliases/EthSendUnsignedTransactionJsonRpcProcedure.md)

## Throws

Errors are returned as JSON-RPC error responses by the request handler

## Example

```typescript
import { createTevmNode } from 'tevm/node'
import { ethSendUnsignedTransactionJsonRpcProcedure } from 'tevm/actions'

const node = createTevmNode()
const procedure = ethSendUnsignedTransactionJsonRpcProcedure(node)

const response = await procedure({
  jsonrpc: '2.0',
  id: 1,
  method: 'eth_sendUnsignedTransaction',
  params: [{ from: `0x${'11'.repeat(20)}`, to: `0x${'69'.repeat(20)}`, value: '0x1a4' }],
})
console.log(response.result)
```
