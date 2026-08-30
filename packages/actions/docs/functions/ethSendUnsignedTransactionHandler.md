[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / ethSendUnsignedTransactionHandler

# Function: ethSendUnsignedTransactionHandler()

> **ethSendUnsignedTransactionHandler**(`client`): [`EthSendUnsignedTransactionHandler`](../type-aliases/EthSendUnsignedTransactionHandler.md)

Defined in: [packages/actions/src/eth/ethSendUnsignedTransactionHandler.js:32](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/ethSendUnsignedTransactionHandler.js#L32)

Creates a handler for `eth_sendUnsignedTransaction`.

Submits a transaction on behalf of an arbitrary `from` address without a signature, exactly as
anvil's `eth_sendUnsignedTransaction` does. The account does not need to be impersonated and does
not need to be funded — the sender is trusted because this is a development node. The resulting
transaction is added to the txpool (or mined immediately when the node is in `auto` mining mode)
and produces a normal receipt.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `TevmNode`\<`"fork"` \| `"normal"`, \{ \}\> | - |

## Returns

[`EthSendUnsignedTransactionHandler`](../type-aliases/EthSendUnsignedTransactionHandler.md)

## Throws

If `from` is not provided

## Example

```typescript
import { createTevmNode } from 'tevm/node'
import { ethSendUnsignedTransactionHandler } from 'tevm/actions'

const node = createTevmNode()
const sendUnsignedTransaction = ethSendUnsignedTransactionHandler(node)

const txHash = await sendUnsignedTransaction({
  from: `0x${'11'.repeat(20)}`,
  to: `0x${'69'.repeat(20)}`,
  value: 420n,
})
console.log(txHash)
```
