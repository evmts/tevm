[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / modeTestnet

# Variable: modeTestnet

> `const` **modeTestnet**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://sepolia.explorer.mode.network/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Blockscout"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://sepolia.explorer.mode.network"`

### blockTime

> **blockTime**: `2000`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.gasPriceOracle

> `readonly` **gasPriceOracle**: `object`

##### Type Declaration

#### contracts.gasPriceOracle.address

> `readonly` **address**: `"0x420000000000000000000000000000000000000F"`

#### contracts.l1Block

> `readonly` **l1Block**: `object`

##### Type Declaration

#### contracts.l1Block.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000015"`

#### contracts.l1StandardBridge

> `readonly` **l1StandardBridge**: `object`

##### Type Declaration

#### contracts.l1StandardBridge.11155111

> `readonly` **11155111**: `object`

##### Type Declaration

#### contracts.l1StandardBridge.11155111.address

> `readonly` **address**: `"0xbC5C679879B2965296756CD959C3C739769995E2"`

#### contracts.l1StandardBridge.11155111.blockCreated

> `readonly` **blockCreated**: `3778392`

#### contracts.l2CrossDomainMessenger

> `readonly` **l2CrossDomainMessenger**: `object`

##### Type Declaration

#### contracts.l2CrossDomainMessenger.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000007"`

#### contracts.l2Erc721Bridge

> `readonly` **l2Erc721Bridge**: `object`

##### Type Declaration

#### contracts.l2Erc721Bridge.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000014"`

#### contracts.l2OutputOracle

> `readonly` **l2OutputOracle**: `object`

##### Type Declaration

#### contracts.l2OutputOracle.11155111

> `readonly` **11155111**: `object`

##### Type Declaration

#### contracts.l2OutputOracle.11155111.address

> `readonly` **address**: `"0x2634BD65ba27AB63811c74A63118ACb312701Bfa"`

#### contracts.l2OutputOracle.11155111.blockCreated

> `readonly` **blockCreated**: `3778393`

#### contracts.l2StandardBridge

> `readonly` **l2StandardBridge**: `object`

##### Type Declaration

#### contracts.l2StandardBridge.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000010"`

#### contracts.l2ToL1MessagePasser

> `readonly` **l2ToL1MessagePasser**: `object`

##### Type Declaration

#### contracts.l2ToL1MessagePasser.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000016"`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xBAba8373113Fb7a68f195deF18732e01aF8eDfCF"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `3019007`

#### contracts.portal

> `readonly` **portal**: `object`

##### Type Declaration

#### contracts.portal.11155111

> `readonly` **11155111**: `object`

##### Type Declaration

#### contracts.portal.11155111.address

> `readonly` **address**: `"0x320e1580effF37E008F1C92700d1eBa47c1B23fD"`

#### contracts.portal.11155111.blockCreated

> `readonly` **blockCreated**: `3778395`

### custom?

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ensTlds?

> `optional` **ensTlds?**: readonly `string`[]

### experimental\_preconfirmationTime?

> `optional` **experimental\_preconfirmationTime?**: `number`

### extendSchema?

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### fees?

> `optional` **fees?**: `ChainFees`

### formatters

> **formatters**: `object`

#### Type Declaration

#### formatters.block

> `readonly` **block**: `object`

##### Type Declaration

#### formatters.block.exclude

> **exclude**: \[\] \| `undefined`

#### formatters.block.format

> **format**: (`args`, `action?`) => `object` & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`OpStackRpcBlock`](../type-aliases/OpStackRpcBlock.md) |
| `action?` | `string` |

##### Returns

`object` & `object`

#### formatters.block.type

> **type**: `"block"`

#### formatters.transaction

> `readonly` **transaction**: `object`

##### Type Declaration

#### formatters.transaction.exclude

> **exclude**: \[\] \| `undefined`

#### formatters.transaction.format

> **format**: (`args`, `action?`) => \{ `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `boolean`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"deposit"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`OpStackRpcTransaction`](../type-aliases/OpStackRpcTransaction.md) |
| `action?` | `string` |

##### Returns

\{ `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `boolean`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"deposit"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: ; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} & `object`

#### formatters.transaction.type

> **type**: `"transaction"`

#### formatters.transactionReceipt

> `readonly` **transactionReceipt**: `object`

##### Type Declaration

#### formatters.transactionReceipt.exclude

> **exclude**: \[\] \| `undefined`

#### formatters.transactionReceipt.format

> **format**: (`args`, `action?`) => `object` & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`OpStackRpcTransactionReceipt`](../type-aliases/OpStackRpcTransactionReceipt.md) |
| `action?` | `string` |

##### Returns

`object` & `object`

#### formatters.transactionReceipt.type

> **type**: `"transactionReceipt"`

### id

> **id**: `919`

### name

> **name**: `"Mode Testnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Ether"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"ETH"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://sepolia.mode.network"`\]

### serializers

> **serializers**: `object`

#### Type Declaration

#### serializers.transaction

> `readonly` **transaction**: [`serializeTransactionOpStack`](../type-aliases/serializeTransactionOpStack.md)

### sourceId

> **sourceId**: `11155111`

### testnet

> **testnet**: `true`

### verifyHash?

> `optional` **verifyHash?**: (`client`, `parameters`) => `Promise`\<`VerifyHashActionReturnType`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | `Client` |
| `parameters` | `VerifyHashActionParameters` |

#### Returns

`Promise`\<`VerifyHashActionReturnType`\>
