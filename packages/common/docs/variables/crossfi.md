[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / crossfi

# Variable: crossfi

> `const` **crossfi**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"CrossFi Blockchain Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://xfiscan.com"`

### blockTime?

> `optional` **blockTime?**: `number`

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

### extendSchema?

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### fees?

> `optional` **fees?**: `ChainFees`

### formatters?

> `optional` **formatters?**: `undefined`

### id

> **id**: `4158`

### name

> **name**: `"CrossFi Mainnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"CrossFi"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"XFI"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://rpc.mainnet.ms"`\]

### serializers?

> `optional` **serializers?**: `ChainSerializers`

### sourceId?

> `optional` **sourceId?**: `number`

### testnet

> **testnet**: `false`

### verifyHash?

> `optional` **verifyHash?**: (`client`, `parameters`) => `Promise`\<`VerifyHashActionReturnType`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | `Client` |
| `parameters` | `VerifyHashActionParameters` |

#### Returns

`Promise`\<`VerifyHashActionReturnType`\>
