[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / TransactionSerializableDeposit

# Type Alias: TransactionSerializableDeposit\<quantity, index\>

> **TransactionSerializableDeposit**\<`quantity`, `index`\> = `Omit`\<`TransactionSerializableBase`\<`quantity`, `index`\>, `"nonce"` \| `"r"` \| `"s"` \| `"v"`\> & `object`

## Type Declaration

### from

> **from**: `Hex`

### isSystemTx?

> `optional` **isSystemTx?**: `boolean`

### mint?

> `optional` **mint?**: `bigint`

### sourceHash

> **sourceHash**: `Hex`

### type

> **type**: `"deposit"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
