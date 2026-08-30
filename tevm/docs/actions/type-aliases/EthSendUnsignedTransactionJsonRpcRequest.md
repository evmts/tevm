[**tevm**](../../README.md)

***

[tevm](../../modules.md) / [actions](../README.md) / EthSendUnsignedTransactionJsonRpcRequest

# Type Alias: EthSendUnsignedTransactionJsonRpcRequest

> **EthSendUnsignedTransactionJsonRpcRequest** = [`JsonRpcRequest`](../../index/type-aliases/JsonRpcRequest.md)\<`"eth_sendUnsignedTransaction"`, readonly \[[`JsonRpcTransaction`](JsonRpcTransaction.md)\]\>

JSON-RPC request for `eth_sendUnsignedTransaction` procedure

Submits a transaction on behalf of an arbitrary `from` address without requiring a signature.
This mirrors anvil's `eth_sendUnsignedTransaction`.
