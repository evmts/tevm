[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / celoAlfajores

# ~~Variable: celoAlfajores~~

> `const` **celoAlfajores**: `object`

## Type Declaration

### ~~blockExplorers~~

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://celo-alfajores.blockscout.com/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Celo Alfajores Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://celo-alfajores.blockscout.com"`

### ~~blockTime~~

> **blockTime**: `1000`

### ~~contracts~~

> **contracts**: `object`

#### Type Declaration

#### contracts.disputeGameFactory

> `readonly` **disputeGameFactory**: `object`

##### Type Declaration

#### contracts.disputeGameFactory.17000

> `readonly` **17000**: `object`

##### Type Declaration

#### contracts.disputeGameFactory.17000.address

> `readonly` **address**: `"0xE28AAdcd9883746c0e5068F58f9ea06027b214cb"`

#### contracts.disputeGameFactory.17000.blockCreated

> `readonly` **blockCreated**: `2411324`

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

#### contracts.l1StandardBridge.17000

> `readonly` **17000**: `object`

##### Type Declaration

#### contracts.l1StandardBridge.17000.address

> `readonly` **address**: `"0xD1B0E0581973c9eB7f886967A606b9441A897037"`

#### contracts.l1StandardBridge.17000.blockCreated

> `readonly` **blockCreated**: `2411324`

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

#### contracts.l2OutputOracle.17000

> `readonly` **17000**: `object`

##### Type Declaration

#### contracts.l2OutputOracle.17000.address

> `readonly` **address**: `"0x4a2635e9e4f6e45817b1D402ac4904c1d1752438"`

#### contracts.l2OutputOracle.17000.blockCreated

> `readonly` **blockCreated**: `2411324`

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

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `14569001`

#### contracts.portal

> `readonly` **portal**: `object`

##### Type Declaration

#### contracts.portal.17000

> `readonly` **17000**: `object`

##### Type Declaration

#### contracts.portal.17000.address

> `readonly` **address**: `"0x82527353927d8D069b3B452904c942dA149BA381"`

#### contracts.portal.17000.blockCreated

> `readonly` **blockCreated**: `2411324`

### ~~custom?~~

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ~~ensTlds?~~

> `optional` **ensTlds?**: readonly `string`[]

### ~~experimental\_preconfirmationTime?~~

> `optional` **experimental\_preconfirmationTime?**: `number`

### ~~extendSchema?~~

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### ~~fees~~

> **fees**: `ChainFees`

### ~~formatters~~

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
| `args` | [`CeloRpcBlock`](../type-aliases/CeloRpcBlock.md) |
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

> **format**: (`args`, `action?`) => \{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee`: `bigint` \| `null`; `gatewayFeeRecipient`: `Address` \| `null`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"cip42"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"cip64"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `undefined`; `feeCurrency?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `boolean`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"deposit"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`CeloRpcTransaction`](../type-aliases/CeloRpcTransaction.md) |
| `action?` | `string` |

##### Returns

\{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee`: `bigint` \| `null`; `gatewayFeeRecipient`: `Address` \| `null`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"cip42"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `feeCurrency`: `Address` \| `null`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `undefined`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"cip64"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `undefined`; `feeCurrency?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `gatewayFee?`: `undefined`; `gatewayFeeRecipient?`: `undefined`; `hash`: `Hash`; `input`: `Hex`; `isSystemTx?`: `boolean`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `mint?`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `sourceHash`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"deposit"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} & `object`

#### formatters.transaction.type

> **type**: `"transaction"`

#### formatters.transactionRequest

> `readonly` **transactionRequest**: `object`

##### Type Declaration

#### formatters.transactionRequest.exclude

> **exclude**: \[\] \| `undefined`

#### formatters.transactionRequest.format

> **format**: (`args`, `action?`) => \{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x0"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x1"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x2"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly ...[] \| readonly ...[]; `blobVersionedHashes`: readonly `Hex`[]; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly ...[] \| readonly ...[]; `blobVersionedHashes?`: readonly ...[]; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `RpcAuthorizationList`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x4"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x7b"`; `value?`: `` `0x${string}` ``; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`CeloTransactionRequest`](../type-aliases/CeloTransactionRequest.md) |
| `action?` | `string` |

##### Returns

\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x0"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x1"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x2"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly ...[] \| readonly ...[]; `blobVersionedHashes`: readonly `Hex`[]; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly ...[] \| readonly ...[]; `blobVersionedHashes?`: readonly ...[]; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `RpcAuthorizationList`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x4"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `feeCurrency?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x7b"`; `value?`: `` `0x${string}` ``; \} & `object`

#### formatters.transactionRequest.type

> **type**: `"transactionRequest"`

### ~~id~~

> **id**: `44787`

### ~~name~~

> **name**: `"Alfajores"`

### ~~nativeCurrency~~

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"CELO"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"A-CELO"`

### ~~prepareTransactionRequest?~~

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### ~~rpcUrls~~

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://alfajores-forno.celo-testnet.org"`\]

### ~~serializers~~

> **serializers**: `object`

#### Type Declaration

#### serializers.transaction

> `readonly` **transaction**: [`serializeTransactionCelo`](../type-aliases/serializeTransactionCelo.md)

### ~~sourceId?~~

> `optional` **sourceId?**: `number`

### ~~testnet~~

> **testnet**: `true`

### ~~verifyHash?~~

> `optional` **verifyHash?**: (`client`, `parameters`) => `Promise`\<`VerifyHashActionReturnType`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | `Client` |
| `parameters` | `VerifyHashActionParameters` |

#### Returns

`Promise`\<`VerifyHashActionReturnType`\>

## Deprecated

use `celoSepolia` instead
