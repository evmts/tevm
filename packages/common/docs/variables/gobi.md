[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / gobi

# Variable: gobi

> `const` **gobi**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"Gobi Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://gobi-explorer.horizen.io"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

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

> **id**: `1663`

### name

> **name**: `"Horizen Gobi Testnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Test ZEN"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"tZEN"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://gobi-testnet.horizenlabs.io/ethv1"`\]

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
