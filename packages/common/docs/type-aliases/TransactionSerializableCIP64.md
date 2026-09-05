[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / TransactionSerializableCIP64

# Type Alias: TransactionSerializableCIP64\<quantity, index\>

> **TransactionSerializableCIP64**\<`quantity`, `index`\> = `TransactionSerializableBase`\<`quantity`, `index`\> & `object` & `ExactPartial`\<`FeeValuesEIP1559`\<`quantity`\>\>

## Type Declaration

### accessList?

> `optional` **accessList?**: `AccessList`

### chainId

> **chainId**: `number`

### feeCurrency?

> `optional` **feeCurrency?**: `Address`

### type?

> `optional` **type?**: `"cip64"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
