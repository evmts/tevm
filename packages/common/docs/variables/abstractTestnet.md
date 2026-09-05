[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / abstractTestnet

# Variable: abstractTestnet

> `const` **abstractTestnet**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"Etherscan"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://sepolia.abscan.org"`

#### blockExplorers.native

> `readonly` **native**: `object`

##### Type Declaration

#### blockExplorers.native.name

> `readonly` **name**: `"Abstract Explorer"`

#### blockExplorers.native.url

> `readonly` **url**: `"https://explorer.testnet.abs.xyz"`

### blockTime

> **blockTime**: `200`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.erc6492Verifier

> `readonly` **erc6492Verifier**: `object`

##### Type Declaration

#### contracts.erc6492Verifier.address

> `readonly` **address**: `"0xfB688330379976DA81eB64Fe4BF50d7401763B9C"`

#### contracts.erc6492Verifier.blockCreated

> `readonly` **blockCreated**: `431682`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xF9cda624FBC7e059355ce98a31693d299FACd963"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `358349`

### custom

> **custom**: `object`

#### Type Declaration

#### custom.getEip712Domain

> `readonly` **getEip712Domain**: `EIP712DomainFn`

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
| `args` | [`ZkSyncRpcBlock`](../type-aliases/ZkSyncRpcBlock.md) |
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

> **format**: (`args`, `action?`) => \{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"priority"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip712"` \| `"priority"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`ZkSyncRpcTransaction`](../type-aliases/ZkSyncRpcTransaction.md) |
| `action?` | `string` |

##### Returns

\{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"priority"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `l1BatchNumber`: `bigint` \| `null`; `l1BatchTxIndex`: `bigint` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `Hex`; `s`: `Hex`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip712"` \| `"priority"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} & `object`

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
| `args` | [`ZkSyncRpcTransactionReceipt`](../type-aliases/ZkSyncRpcTransactionReceipt.md) |
| `action?` | `string` |

##### Returns

`object` & `object`

#### formatters.transactionReceipt.type

> **type**: `"transactionReceipt"`

#### formatters.transactionRequest

> `readonly` **transactionRequest**: `object`

##### Type Declaration

#### formatters.transactionRequest.exclude

> **exclude**: (`"paymaster"` \| `"gasPerPubdata"` \| `"factoryDeps"` \| `"paymasterInput"` \| `"customSignature"`)[] \| `undefined`

#### formatters.transactionRequest.format

> **format**: (`args`, `action?`) => \{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x0"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x1"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x2"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly ...[] \| readonly ...[]; `blobVersionedHashes`: readonly `Hex`[]; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly ...[] \| readonly ...[]; `blobVersionedHashes?`: readonly ...[]; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `RpcAuthorizationList`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x4"`; `value?`: `` `0x${string}` ``; \} \| \{ `data?`: `` `0x${string}` ``; `eip712Meta`: [`ZkSyncEip712Meta`](../type-aliases/ZkSyncEip712Meta.md); `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `to?`: `` `0x${string}` `` \| `null`; `type`: `"0xff"` \| `"0x71"`; `value?`: `` `0x${string}` ``; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`ZkSyncTransactionRequest`](../type-aliases/ZkSyncTransactionRequest.md) |
| `action?` | `string` |

##### Returns

\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x0"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x1"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x2"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly ...[] \| readonly ...[]; `blobVersionedHashes`: readonly `Hex`[]; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly ...[] \| readonly ...[]; `blobVersionedHashes?`: readonly ...[]; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `RpcAuthorizationList`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `eip712Meta?`: ; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x4"`; `value?`: `` `0x${string}` ``; \} \| \{ `data?`: `` `0x${string}` ``; `eip712Meta`: [`ZkSyncEip712Meta`](../type-aliases/ZkSyncEip712Meta.md); `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `to?`: `` `0x${string}` `` \| `null`; `type`: `"0xff"` \| `"0x71"`; `value?`: `` `0x${string}` ``; \} & `object`

#### formatters.transactionRequest.type

> **type**: `"transactionRequest"`

### id

> **id**: `11124`

### name

> **name**: `"Abstract Testnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"ETH"`

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

> `readonly` **http**: readonly \[`"https://api.testnet.abs.xyz"`\]

### serializers

> **serializers**: `object`

#### Type Declaration

#### serializers.transaction

> `readonly` **transaction**: `serializeTransaction`

### sourceId?

> `optional` **sourceId?**: `number`

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
