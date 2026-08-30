[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSubscribeJsonRpcRequest

# Type Alias: EthSubscribeJsonRpcRequest

> **EthSubscribeJsonRpcRequest** = `JsonRpcRequest`\<`"eth_subscribe"`, readonly \[`"newHeads"` \| `"logs"` \| `"newPendingTransactions"` \| `"syncing"`, `SerializeToJson`\<\{ `address?`: `Address` \| `Address`[]; `topics?`: (`Hex` \| `Hex`[] \| `null`)[]; \}\>\]\>

Defined in: [packages/actions/src/eth/EthJsonRpcRequest.ts:348](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcRequest.ts#L348)

JSON-RPC request for `eth_subscribe` procedure
