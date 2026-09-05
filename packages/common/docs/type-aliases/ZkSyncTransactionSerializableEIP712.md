[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncTransactionSerializableEIP712

# Type Alias: ZkSyncTransactionSerializableEIP712\<quantity, index\>

> **ZkSyncTransactionSerializableEIP712**\<`quantity`, `index`\> = `Omit`\<`TransactionSerializableEIP1559`\<`quantity`, `index`\>, `"type"`\> & `object`

## Type Declaration

### customSignature?

> `optional` **customSignature?**: `Hex`

### factoryDeps?

> `optional` **factoryDeps?**: `Hex`[]

### from

> **from**: `Hex`

### gasPerPubdata?

> `optional` **gasPerPubdata?**: `bigint`

### paymaster?

> `optional` **paymaster?**: `Address`

### paymasterInput?

> `optional` **paymasterInput?**: `Hex`

### type?

> `optional` **type?**: `"eip712"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
