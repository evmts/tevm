[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / TransactionRequestEIP712

# Type Alias: TransactionRequestEIP712\<quantity, index, transactionType\>

> **TransactionRequestEIP712**\<`quantity`, `index`, `transactionType`\> = `TransactionRequestBase`\<`quantity`, `index`\> & `ExactPartial`\<`FeeValuesEIP1559`\<`quantity`\>\> & `object`

## Type Declaration

### accessList?

> `optional` **accessList?**: `undefined`

### customSignature?

> `optional` **customSignature?**: `Hex`

### factoryDeps?

> `optional` **factoryDeps?**: `Hex`[]

### gasPerPubdata?

> `optional` **gasPerPubdata?**: `bigint`

### paymaster?

> `optional` **paymaster?**: `Address`

### paymasterInput?

> `optional` **paymasterInput?**: `Hex`

### type?

> `optional` **type?**: `transactionType`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
| `transactionType` | `"eip712"` |
