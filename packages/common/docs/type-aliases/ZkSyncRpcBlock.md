[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncRpcBlock

# Type Alias: ZkSyncRpcBlock\<blockTag, includeTransactions\>

> **ZkSyncRpcBlock**\<`blockTag`, `includeTransactions`\> = [`Assign`](Assign.md)\<`RpcBlock`\<`blockTag`, `includeTransactions`, [`ZkSyncRpcTransaction`](ZkSyncRpcTransaction.md)\<`blockTag` *extends* `"pending"` ? `true` : `false`\>\>, \{ `l1BatchNumber`: `Hex` \| `null`; `l1BatchTimestamp`: `Hex` \| `null`; \}\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `blockTag` *extends* `BlockTag` | `BlockTag` |
| `includeTransactions` *extends* `boolean` | `boolean` |
