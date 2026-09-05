[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / serializeTransactionOpStack

# Type Alias: serializeTransactionOpStack

> **serializeTransactionOpStack** = (`transaction`, `signature?`) => `` `0x02${string}` `` \| `` `0x01${string}` `` \| `` `0x03${string}` `` \| `` `0x04${string}` `` \| `TransactionSerializedLegacy` \| `` `0x7e${string}` ``

## Parameters

| Parameter | Type |
| ------ | ------ |
| `transaction` | [`OpStackTransactionSerializable`](OpStackTransactionSerializable.md) |
| `signature?` | `Signature` |

## Returns

`` `0x02${string}` `` \| `` `0x01${string}` `` \| `` `0x03${string}` `` \| `` `0x04${string}` `` \| `TransactionSerializedLegacy` \| `` `0x7e${string}` ``
