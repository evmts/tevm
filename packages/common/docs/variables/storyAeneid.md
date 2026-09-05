[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / storyAeneid

# Variable: storyAeneid

> `const` **storyAeneid**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://aeneid.storyscan.io/api/v2"`

#### blockExplorers.default.name

> `readonly` **name**: `"Story Aeneid Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://aeneid.storyscan.io"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.ensRegistry

> `readonly` **ensRegistry**: `object`

##### Type Declaration

#### contracts.ensRegistry.address

> `readonly` **address**: `"0x5dC881dDA4e4a8d312be3544AD13118D1a04Cb17"`

#### contracts.ensRegistry.blockCreated

> `readonly` **blockCreated**: `1322033`

#### contracts.ensUniversalResolver

> `readonly` **ensUniversalResolver**: `object`

##### Type Declaration

#### contracts.ensUniversalResolver.address

> `readonly` **address**: `"0x6D3B3F99177FB2A5de7F9E928a9BD807bF7b5BAD"`

#### contracts.ensUniversalResolver.blockCreated

> `readonly` **blockCreated**: `1322097`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xca11bde05977b3631167028862be2a173976ca11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `1792`

### custom?

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ensTlds

> **ensTlds**: readonly \[`".ip"`\]

### experimental\_preconfirmationTime?

> `optional` **experimental\_preconfirmationTime?**: `number`

### extendSchema?

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### fees?

> `optional` **fees?**: `ChainFees`

### formatters?

> `optional` **formatters?**: `undefined`

### id

> **id**: `1315`

### name

> **name**: `"Story Aeneid"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"IP"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"IP"`

### network

> `readonly` **network**: `"story-aeneid"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://aeneid.storyrpc.io"`\]

### serializers?

> `optional` **serializers?**: `ChainSerializers`

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
