[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / OpStackBlock

# Type Alias: OpStackBlock\<includeTransactions, blockTag\>

> **OpStackBlock**\<`includeTransactions`, `blockTag`\> = `Block`\<`bigint`, `includeTransactions`, `blockTag`, [`OpStackTransaction`](OpStackTransaction.md)\<`blockTag` *extends* `"pending"` ? `true` : `false`\>\> & [`OpStackBlockOverrides`](OpStackBlockOverrides.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `includeTransactions` *extends* `boolean` | `boolean` |
| `blockTag` *extends* `BlockTag` | `BlockTag` |
