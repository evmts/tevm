[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncTransactionReceipt

# Type Alias: ZkSyncTransactionReceipt\<status, type\>

> **ZkSyncTransactionReceipt**\<`status`, `type`\> = `Omit`\<`TransactionReceipt`\<`bigint`, `number`, `status`, `type`\>, `"logs"`\> & [`ZkSyncTransactionReceiptOverrides`](ZkSyncTransactionReceiptOverrides.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `status` | `"success"` \| `"reverted"` |
| `type` | [`ZkSyncTransactionType`](ZkSyncTransactionType.md) |
