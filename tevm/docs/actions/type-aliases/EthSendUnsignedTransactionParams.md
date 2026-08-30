[**tevm**](../../README.md)

***

[tevm](../../modules.md) / [actions](../README.md) / EthSendUnsignedTransactionParams

# Type Alias: EthSendUnsignedTransactionParams

> **EthSendUnsignedTransactionParams** = [`CallParams`](CallParams.md) & `object`

**`Experimental`**

Based on the JSON-RPC request for `eth_sendUnsignedTransaction` procedure.
Unlike [EthSendTransactionParams](EthSendTransactionParams.md) the `from` address is required and is
always used as the sender regardless of whether it is impersonated.

## Type Declaration

### from

> `readonly` **from**: [`Address`](Address.md)
