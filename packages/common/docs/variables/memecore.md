[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / memecore

# Variable: memecore

> `const` **memecore**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://api.memecorescan.io/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"MemeCore Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://memecorescan.io"`

#### blockExplorers.memecore

> `readonly` **memecore**: `object`

##### Type Declaration

#### blockExplorers.memecore.apiUrl

> `readonly` **apiUrl**: `"https://blockscout.memecore.com/api"`

#### blockExplorers.memecore.name

> `readonly` **name**: `"MemeCore Explorer"`

#### blockExplorers.memecore.url

> `readonly` **url**: `"https://blockscout.memecore.com"`

#### blockExplorers.okx

> `readonly` **okx**: `object`

##### Type Declaration

#### blockExplorers.okx.name

> `readonly` **name**: `"MemeCore Explorer"`

#### blockExplorers.okx.url

> `readonly` **url**: `"https://web3.okx.com/explorer/memecore"`

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

> **id**: `4352`

### name

> **name**: `"MemeCore"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"M"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"M"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://rpc.memecore.net"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://ws.memecore.net"`\]

### serializers?

> `optional` **serializers?**: `ChainSerializers`

### sourceId?

> `optional` **sourceId?**: `number`

### testnet?

> `optional` **testnet?**: `boolean`

### verifyHash?

> `optional` **verifyHash?**: (`client`, `parameters`) => `Promise`\<`VerifyHashActionReturnType`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | `Client` |
| `parameters` | `VerifyHashActionParameters` |

#### Returns

`Promise`\<`VerifyHashActionReturnType`\>
