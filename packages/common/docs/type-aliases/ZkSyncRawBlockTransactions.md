[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / ZkSyncRawBlockTransactions

# Type Alias: ZkSyncRawBlockTransactions

> **ZkSyncRawBlockTransactions** = `object`[]

## Type Declaration

### commonData

> **commonData**: `object`

#### Type Declaration

#### commonData.L1?

> `optional` **L1?**: `object` & `CommonDataRawBlockTransaction`

##### Type Declaration

###### deadlineBlock

> **deadlineBlock**: `number`

###### fullFee

> **fullFee**: `Hex`

###### layer2TipFee

> **layer2TipFee**: `Hex`

###### opProcessingType

> **opProcessingType**: `string`

###### priorityQueueType

> **priorityQueueType**: `string`

###### serialId

> **serialId**: `number`

#### commonData.L2?

> `optional` **L2?**: `object`

##### Type Declaration

#### commonData.L2.fee

> **fee**: `ZksyncFee`\<`Hex`\>

#### commonData.L2.initiatorAddress

> **initiatorAddress**: `Address`

#### commonData.L2.input?

> `optional` **input?**: `object`

##### Type Declaration

#### commonData.L2.input.data

> **data**: `Uint8Array`

#### commonData.L2.input.hash

> **hash**: `Hash`

#### commonData.L2.nonce

> **nonce**: `number`

#### commonData.L2.paymasterParams

> **paymasterParams**: `object`

##### Type Declaration

#### commonData.L2.paymasterParams.paymaster

> **paymaster**: `Address`

#### commonData.L2.paymasterParams.paymasterInput

> **paymasterInput**: `Uint8Array`

#### commonData.L2.signature

> **signature**: `Uint8Array`

#### commonData.L2.transactionType

> **transactionType**: `string`

#### commonData.ProtocolUpgrade?

> `optional` **ProtocolUpgrade?**: `object` & `CommonDataRawBlockTransaction`

##### Type Declaration

###### upgradeId

> **upgradeId**: `string`

### execute

> **execute**: `object`

#### Type Declaration

#### execute.calldata

> **calldata**: `Hash`

#### execute.contractAddress

> **contractAddress**: `Address`

#### execute.factoryDeps?

> `optional` **factoryDeps?**: `Hash`

#### execute.value

> **value**: `bigint`

### rawBytes?

> `optional` **rawBytes?**: `string`

### receivedTimestampMs

> **receivedTimestampMs**: `number`
