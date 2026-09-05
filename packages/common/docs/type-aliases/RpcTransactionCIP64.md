[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / RpcTransactionCIP64

# Type Alias: RpcTransactionCIP64\<isPending\>

> **RpcTransactionCIP64**\<`isPending`\> = `Omit`\<`TransactionBase`\<`Quantity`, `Index`, `isPending`\>, `"typeHex"`\> & `object` & `FeeValuesEIP1559`\<`Quantity`\>

## Type Declaration

### accessList

> **accessList**: `AccessList`

### chainId

> **chainId**: `Index`

### feeCurrency

> **feeCurrency**: `Address` \| `null`

### type

> **type**: `"0x7b"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `isPending` *extends* `boolean` | `boolean` |
