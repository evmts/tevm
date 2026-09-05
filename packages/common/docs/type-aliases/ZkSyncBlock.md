[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncBlock

# Type Alias: ZkSyncBlock\<includeTransactions, blockTag\>

> **ZkSyncBlock**\<`includeTransactions`, `blockTag`\> = [`Assign`](Assign.md)\<`Block`\<`bigint`, `includeTransactions`, `blockTag`, [`ZkSyncTransaction`](ZkSyncTransaction.md)\<`blockTag` *extends* `"pending"` ? `true` : `false`\>\>, \{ `l1BatchNumber`: `bigint` \| `null`; `l1BatchTimestamp`: `bigint` \| `null`; \}\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `includeTransactions` *extends* `boolean` | `boolean` |
| `blockTag` *extends* `BlockTag` | `BlockTag` |
