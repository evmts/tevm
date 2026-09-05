[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / OpStackRpcBlock

# Type Alias: OpStackRpcBlock\<blockTag, includeTransactions\>

> **OpStackRpcBlock**\<`blockTag`, `includeTransactions`\> = `RpcBlock`\<`blockTag`, `includeTransactions`, [`OpStackRpcTransaction`](OpStackRpcTransaction.md)\<`blockTag` *extends* `"pending"` ? `true` : `false`\>\> & [`OpStackRpcBlockOverrides`](OpStackRpcBlockOverrides.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `blockTag` *extends* `BlockTag` | `BlockTag` |
| `includeTransactions` *extends* `boolean` | `boolean` |
