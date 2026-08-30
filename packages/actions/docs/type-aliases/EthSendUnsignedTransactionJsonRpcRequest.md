[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSendUnsignedTransactionJsonRpcRequest

# Type Alias: EthSendUnsignedTransactionJsonRpcRequest

> **EthSendUnsignedTransactionJsonRpcRequest** = `JsonRpcRequest`\<`"eth_sendUnsignedTransaction"`, readonly \[[`JsonRpcTransaction`](JsonRpcTransaction.md)\]\>

Defined in: [packages/actions/src/eth/EthJsonRpcRequest.ts:281](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcRequest.ts#L281)

JSON-RPC request for `eth_sendUnsignedTransaction` procedure

Submits a transaction on behalf of an arbitrary `from` address without requiring a signature.
This mirrors anvil's `eth_sendUnsignedTransaction`.
