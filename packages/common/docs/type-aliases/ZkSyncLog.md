[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncLog

# Type Alias: ZkSyncLog\<quantity, index, pending, abiEvent, strict, abi, eventName\>

> **ZkSyncLog**\<`quantity`, `index`, `pending`, `abiEvent`, `strict`, `abi`, `eventName`\> = `Log_`\<`quantity`, `index`, `pending`, `abiEvent`, `strict`, `abi`, `eventName`\> & `object`

## Type Declaration

### l1BatchNumber

> **l1BatchNumber**: `quantity` \| `null`

### logType

> **logType**: `Hex` \| `null`

### transactionLogIndex

> **transactionLogIndex**: `index`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `quantity` | `bigint` |
| `index` | `number` |
| `pending` *extends* `boolean` | `boolean` |
| `abiEvent` *extends* `AbiEvent` \| `undefined` | `undefined` |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `abi` *extends* `Abi` \| readonly `unknown`[] \| `undefined` | `abiEvent` *extends* `AbiEvent` ? \[`abiEvent`\] : `undefined` |
| `eventName` *extends* `string` \| `undefined` | `abiEvent` *extends* `AbiEvent` ? `abiEvent`\[`"name"`\] : `undefined` |
