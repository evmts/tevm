[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncTransactionRequestEIP712

# Type Alias: ZkSyncTransactionRequestEIP712\<quantity, index\>

> **ZkSyncTransactionRequestEIP712**\<`quantity`, `index`\> = `Omit`\<`TransactionRequestBase`\<`quantity`, `index`\>, `"type"`\> & `ExactPartial`\<`FeeValuesEIP1559`\> & `object` & \{ `paymaster`: `Address`; `paymasterInput`: `Hex`; \} \| \{ `paymaster?`: `undefined`; `paymasterInput?`: `undefined`; \}

## Type Declaration

### customSignature?

> `optional` **customSignature?**: `Hex`

### factoryDeps?

> `optional` **factoryDeps?**: `Hex`[]

### gasPerPubdata?

> `optional` **gasPerPubdata?**: `bigint`

### type?

> `optional` **type?**: `"eip712"` \| `"priority"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
