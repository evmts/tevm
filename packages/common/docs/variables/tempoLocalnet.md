[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / tempoLocalnet

# Variable: tempoLocalnet

> `const` **tempoLocalnet**: `object`

## Type Declaration

### blockExplorers?

> `optional` **blockExplorers?**: `object`

#### Type Declaration

#### Index Signature

\[`key`: `string`\]: `object`

#### blockExplorers.default

> **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl?

> `optional` **apiUrl?**: `string`

#### blockExplorers.default.name

> **name**: `string`

#### blockExplorers.default.url

> **url**: `string`

### blockTime

> **blockTime**: `1000`

### contracts?

> `optional` **contracts?**: `object`

#### Type Declaration

#### Index Signature

\[`x`: `string`\]: `ChainContract` \| \{\[`sourceId`: `number`\]: `ChainContract` \| `undefined`; \} \| `undefined`

#### contracts.ensRegistry?

> `optional` **ensRegistry?**: `ChainContract`

#### contracts.ensUniversalResolver?

> `optional` **ensUniversalResolver?**: `ChainContract`

#### contracts.erc6492Verifier?

> `optional` **erc6492Verifier?**: `ChainContract`

#### contracts.multicall3?

> `optional` **multicall3?**: `ChainContract`

### custom?

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ensTlds?

> `optional` **ensTlds?**: readonly `string`[]

### experimental\_preconfirmationTime?

> `optional` **experimental\_preconfirmationTime?**: `number`

### extend

> **extend**: \<`extended_1`\>(`extended`) => [`Assign`](../type-aliases/Assign.md)

#### Type Parameters

| Type Parameter |
| ------ |
| `extended_1` *extends* `object` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `extended` | `extended_1` |

#### Returns

[`Assign`](../type-aliases/Assign.md)

### extendSchema

> **extendSchema**: `object`

#### Type Declaration

#### extendSchema.feeToken?

> `optional` **feeToken?**: `TokenIdOrAddress`

#### extendSchema.hardfork?

> `optional` **hardfork?**: `Hardfork`

### fees?

> `optional` **fees?**: `ChainFees`

### formatters

> **formatters**: `object`

#### Type Declaration

#### formatters.transaction

> `readonly` **transaction**: `object`

##### Type Declaration

#### formatters.transaction.exclude

> **exclude**: `never`[] \| `undefined`

#### formatters.transaction.format

> **format**: (`args`, `action?`) => \{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId?`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: readonly ...[]; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls`: readonly `Call`[]; `chainId`: `number`; `feePayerSignature?`: `Signature`; `feeToken?`: `` `0x${string}` ``; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input?`: `undefined`; `keyAuthorization?`: `Signed` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `bigint`; `r?`: `` `0x${string}` ``; `s?`: `` `0x${string}` ``; `signature`: `SignatureEnvelope`; `to?`: `undefined`; `transactionIndex`: `number` \| `null`; `type`: `"tempo"`; `typeHex`: `Hex` \| `null`; `v?`: `bigint`; `validAfter?`: `number`; `validBefore?`: `number`; `value?`: `undefined`; `yParity?`: `number`; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `TransactionRpc` |
| `action?` | `string` |

##### Returns

\{ `accessList?`: ; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId?`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"legacy"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity?`: ; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip2930"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip1559"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: ; `blobVersionedHashes`: readonly `Hex`[]; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip4844"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: ; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls?`: `undefined`; `chainId`: `number`; `feePayerSignature?`: `undefined`; `feeToken?`: `undefined`; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input`: `Hex`; `keyAuthorization?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `undefined`; `r`: `Hex`; `s`: `Hex`; `signature?`: `undefined`; `to`: `Address` \| `null`; `transactionIndex`: `number` \| `null`; `type`: `"eip7702"`; `typeHex`: `Hex` \| `null`; `v`: `bigint`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: readonly ...[]; `blobVersionedHashes?`: `undefined`; `blockHash`: `` `0x${string}` `` \| `null`; `blockNumber`: `bigint` \| `null`; `blockTimestamp?`: `bigint`; `calls`: readonly `Call`[]; `chainId`: `number`; `feePayerSignature?`: `Signature`; `feeToken?`: `` `0x${string}` ``; `from`: `Address`; `gas`: `bigint`; `gasPrice?`: ; `hash`: `Hash`; `input?`: `undefined`; `keyAuthorization?`: `Signed` \| `null`; `maxFeePerBlobGas?`: ; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `nonceKey?`: `bigint`; `r?`: `` `0x${string}` ``; `s?`: `` `0x${string}` ``; `signature`: `SignatureEnvelope`; `to?`: `undefined`; `transactionIndex`: `number` \| `null`; `type`: `"tempo"`; `typeHex`: `Hex` \| `null`; `v?`: `bigint`; `validAfter?`: `number`; `validBefore?`: `number`; `value?`: `undefined`; `yParity?`: `number`; \} & `object`

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
| `args` | `TransactionReceiptRpc` |
| `action?` | `string` |

##### Returns

`object` & `object`

#### formatters.transactionReceipt.type

> **type**: `"transactionReceipt"`

#### formatters.transactionRequest

> `readonly` **transactionRequest**: `object`

##### Type Declaration

#### formatters.transactionRequest.exclude

> **exclude**: \[\] \| `undefined`

#### formatters.transactionRequest.format

> **format**: (`args`, `action?`) => \{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x0"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x1"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x2"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly ...[] \| readonly ...[]; `blobVersionedHashes`: readonly `Hex`[]; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly ...[] \| readonly ...[]; `blobVersionedHashes?`: readonly ...[]; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `RpcAuthorizationList`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x4"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: readonly ...[]; `capabilities?`: \{\[`x`: `string`\]: `any`; \}; `data?`: `` `0x${string}` ``; `feePayer?`: `true` \| `Account`; `feeToken?`: `bigint` \| `Address`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `Signed`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `` `0x${string}` `` \| `"expiring"`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x76"`; `validAfter?`: `` `0x${string}` ``; `validBefore?`: `` `0x${string}` ``; `value?`: `` `0x${string}` ``; \} & `object`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `TransactionRequest` |
| `action?` | `string` |

##### Returns

\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x0"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: `` `0x${string}` ``; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: ; `maxPriorityFeePerGas?`: ; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x1"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x2"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly ...[] \| readonly ...[]; `blobVersionedHashes`: readonly `Hex`[]; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly ...[] \| readonly ...[]; `blobVersionedHashes?`: readonly ...[]; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `` `0x${string}` ``; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: readonly ...[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"0x3"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `RpcAuthorizationList`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: `undefined`; `capabilities?`: `undefined`; `data?`: `` `0x${string}` ``; `feePayer?`: `undefined`; `feeToken?`: `undefined`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `undefined`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x4"`; `validAfter?`: `undefined`; `validBefore?`: `undefined`; `value?`: `` `0x${string}` ``; \} \| \{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `calls?`: readonly ...[]; `capabilities?`: \{\[`x`: `string`\]: `any`; \}; `data?`: `` `0x${string}` ``; `feePayer?`: `true` \| `Account`; `feeToken?`: `bigint` \| `Address`; `from?`: `` `0x${string}` ``; `gas?`: `` `0x${string}` ``; `gasPrice?`: ; `keyAuthorization?`: `Signed`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: ; `maxFeePerGas?`: `` `0x${string}` ``; `maxPriorityFeePerGas?`: `` `0x${string}` ``; `nonce?`: `` `0x${string}` ``; `nonceKey?`: `` `0x${string}` `` \| `"expiring"`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"0x76"`; `validAfter?`: `` `0x${string}` ``; `validBefore?`: `` `0x${string}` ``; `value?`: `` `0x${string}` ``; \} & `object`

#### formatters.transactionRequest.type

> **type**: `"transactionRequest"`

### hardfork

> `readonly` **hardfork**: `"t3"`

### id

> **id**: `1337`

### name

> **name**: `"Tempo"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `6`

#### nativeCurrency.name

> `readonly` **name**: `"USD"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"USD"`

### prepareTransactionRequest

> **prepareTransactionRequest**: \[(`r`, `{ phase }`) => `Promise`\<`PrepareTransactionRequestParameters`\>, \{ `runAt`: readonly \[`"beforeFillTransaction"`, `"afterFillParameters"`\]; \}\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"http://localhost:8545"`\]

### serializers

> **serializers**: `object`

#### Type Declaration

#### serializers.transaction

> `readonly` **transaction**: `SerializeTransactionFn`

### sourceId?

> `optional` **sourceId?**: `number`

### testnet?

> `optional` **testnet?**: `boolean`

### verifyHash

> **verifyHash**: (`client`, `parameters`) => `Promise`\<`boolean`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | `Client` |
| `parameters` | `VerifyHashActionParameters` |

#### Returns

`Promise`\<`boolean`\>
