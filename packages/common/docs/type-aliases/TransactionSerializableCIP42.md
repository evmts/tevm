[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / TransactionSerializableCIP42

# Type Alias: TransactionSerializableCIP42\<quantity, index\>

> **TransactionSerializableCIP42**\<`quantity`, `index`\> = `TransactionSerializableBase`\<`quantity`, `index`\> & `object` & `ExactPartial`\<`FeeValuesEIP1559`\<`quantity`\>\>

## Type Declaration

### accessList?

> `optional` **accessList?**: `AccessList`

### chainId

> **chainId**: `number`

### feeCurrency?

> `optional` **feeCurrency?**: `Address`

### gatewayFee?

> `optional` **gatewayFee?**: `quantity`

### gatewayFeeRecipient?

> `optional` **gatewayFeeRecipient?**: `Address`

### type?

> `optional` **type?**: `"cip42"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
