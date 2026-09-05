[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / klaytnBaobab

# ~~Variable: klaytnBaobab~~

> `const` **klaytnBaobab**: `object`

## Type Declaration

### ~~blockExplorers~~

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"KlaytnScope"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://baobab.klaytnscope.com"`

### ~~blockTime?~~

> `optional` **blockTime?**: `number`

### ~~contracts~~

> **contracts**: `object`

#### Type Declaration

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `123390593`

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

> **id**: `1001`

### ~~name~~

> **name**: `"Klaytn Baobab Testnet"`

### ~~nativeCurrency~~

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Baobab Klaytn"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"KLAY"`

### ~~network~~

> `readonly` **network**: `"klaytn-baobab"`

### ~~prepareTransactionRequest?~~

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### ~~rpcUrls~~

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://public-en-baobab.klaytn.net"`\]

### ~~serializers?~~

> `optional` **serializers?**: `ChainSerializers`

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

Use `kairos` instead.
