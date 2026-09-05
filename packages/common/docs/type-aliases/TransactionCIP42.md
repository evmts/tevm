[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / TransactionCIP42

# Type Alias: TransactionCIP42\<isPending\>

> **TransactionCIP42**\<`isPending`\> = `TransactionBase`\<`bigint`, `number`, `isPending`\> & `FeeValuesEIP1559` & `object`

## Type Declaration

### accessList

> **accessList**: `AccessList`

### chainId

> **chainId**: `number`

### feeCurrency

> **feeCurrency**: `Address` \| `null`

### gatewayFee

> **gatewayFee**: `bigint` \| `null`

### gatewayFeeRecipient

> **gatewayFeeRecipient**: `Address` \| `null`

### type

> **type**: `"cip42"`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `isPending` *extends* `boolean` | `boolean` |
