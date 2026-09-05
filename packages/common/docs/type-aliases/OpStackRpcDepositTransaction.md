[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / OpStackRpcDepositTransaction

# Type Alias: OpStackRpcDepositTransaction\<pending\>

> **OpStackRpcDepositTransaction**\<`pending`\> = `Omit`\<`TransactionBase`\<`Quantity`, `Index`, `pending`\>, `"typeHex"`\> & `FeeValuesEIP1559`\<`Quantity`\> & `object`

## Type Declaration

### isSystemTx?

> `optional` **isSystemTx?**: `boolean`

### mint?

> `optional` **mint?**: `Hex`

### sourceHash

> **sourceHash**: `Hex`

### type

> **type**: `"0x7e"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `pending` *extends* `boolean` | `boolean` |
