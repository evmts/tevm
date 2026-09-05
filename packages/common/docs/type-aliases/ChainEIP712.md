[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ChainEIP712

# Type Alias: ChainEIP712\<formatters, TransactionSignable, transactionSerializable\>

> **ChainEIP712**\<`formatters`, `TransactionSignable`, `transactionSerializable`\> = [`Common`](Common.md)\<`formatters`, \{ `getEip712Domain?`: `EIP712DomainFn`\<`transactionSerializable`, `TransactionSignable`\>; \}\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `formatters` *extends* `ChainFormatters` \| `undefined` | `ChainFormatters` \| `undefined` |
| `TransactionSignable` | `object` |
| `transactionSerializable` *extends* [`ZkSyncTransactionSerializable`](ZkSyncTransactionSerializable.md) | `formatters` *extends* `ChainFormatters` ? `formatters`\[`"transactionRequest"`\] *extends* `ChainFormatter` ? [`ZkSyncTransactionSerializable`](ZkSyncTransactionSerializable.md) & `Parameters`\<`formatters`\[`"transactionRequest"`\]\[`"format"`\]\>\[`0`\] : [`ZkSyncTransactionSerializable`](ZkSyncTransactionSerializable.md) : [`ZkSyncTransactionSerializable`](ZkSyncTransactionSerializable.md) |
