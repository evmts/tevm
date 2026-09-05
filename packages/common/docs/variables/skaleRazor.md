[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / skaleRazor

# ~~Variable: skaleRazor~~

> `const` **skaleRazor**: `object`

## Type Declaration

### ~~blockExplorers~~

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"SKALE Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://turbulent-unique-scheat.explorer.mainnet.skalenodes.com"`

### ~~blockTime?~~

> `optional` **blockTime?**: `number`

### ~~contracts~~

> **contracts**: `object`

### ~~custom?~~

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ~~ensTlds?~~

> `optional` **ensTlds?**: readonly `string`[]

### ~~experimental\_preconfirmationTime?~~

> `optional` **experimental\_preconfirmationTime?**: `number`

### ~~extendSchema?~~

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### ~~fees?~~

> `optional` **fees?**: `ChainFees`

### ~~formatters?~~

> `optional` **formatters?**: `undefined`

### ~~id~~

> **id**: `278611351`

### ~~name~~

> **name**: "SKALE \| Razor Network"

### ~~nativeCurrency~~

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"sFUEL"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"sFUEL"`

### ~~prepareTransactionRequest?~~

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### ~~rpcUrls~~

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://mainnet.skalenodes.com/v1/turbulent-unique-scheat"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://mainnet.skalenodes.com/v1/ws/turbulent-unique-scheat"`\]

### ~~serializers?~~

> `optional` **serializers?**: `ChainSerializers`

### ~~sourceId?~~

> `optional` **sourceId?**: `number`

### ~~testnet?~~

> `optional` **testnet?**: `boolean`

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

Use `skaleEuropa` instead.
