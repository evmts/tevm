[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / RpcTransactionCIP42

# Type Alias: RpcTransactionCIP42\<isPending\>

> **RpcTransactionCIP42**\<`isPending`\> = `Omit`\<`TransactionBase`\<`Quantity`, `Index`, `isPending`\>, `"typeHex"`\> & `object` & `FeeValuesEIP1559`\<`Quantity`\>

## Type Declaration

### accessList

> **accessList**: `AccessList`

### chainId

> **chainId**: `Index`

### feeCurrency

> **feeCurrency**: `Address` \| `null`

### gatewayFee

> **gatewayFee**: `Hex` \| `null`

### gatewayFeeRecipient

> **gatewayFeeRecipient**: `Address` \| `null`

### type

> **type**: `"0x7c"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `isPending` *extends* `boolean` | `boolean` |
