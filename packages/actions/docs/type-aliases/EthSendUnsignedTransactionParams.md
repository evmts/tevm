[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSendUnsignedTransactionParams

# Type Alias: EthSendUnsignedTransactionParams

> **EthSendUnsignedTransactionParams** = [`CallParams`](CallParams.md) & `object`

Defined in: [packages/actions/src/eth/EthParams.ts:276](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L276)

**`Experimental`**

Based on the JSON-RPC request for `eth_sendUnsignedTransaction` procedure.
Unlike [EthSendTransactionParams](EthSendTransactionParams.md) the `from` address is required and is
always used as the sender regardless of whether it is impersonated.

## Type Declaration

### from

> `readonly` **from**: [`Address`](Address.md)
