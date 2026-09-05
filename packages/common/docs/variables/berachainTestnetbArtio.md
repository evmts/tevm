[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / berachainTestnetbArtio

# Variable: berachainTestnetbArtio

> `const` **berachainTestnetbArtio**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"Berachain bArtio Beratrail"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://bartio.beratrail.io"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.ensRegistry

> `readonly` **ensRegistry**: `object`

##### Type Declaration

#### contracts.ensRegistry.address

> `readonly` **address**: `"0xB0eef18971290b333450586D33dcA6cE122651D2"`

#### contracts.ensRegistry.blockCreated

> `readonly` **blockCreated**: `7736794`

#### contracts.ensUniversalResolver

> `readonly` **ensUniversalResolver**: `object`

##### Type Declaration

#### contracts.ensUniversalResolver.address

> `readonly` **address**: `"0x41692Ef1EA0C79E6b73077E4A67572D2BDbD7057"`

#### contracts.ensUniversalResolver.blockCreated

> `readonly` **blockCreated**: `7736795`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `109269`

### custom?

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ensTlds

> **ensTlds**: readonly \[`".bera"`\]

### experimental\_preconfirmationTime?

> `optional` **experimental\_preconfirmationTime?**: `number`

### extendSchema?

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### fees?

> `optional` **fees?**: `ChainFees`

### formatters?

> `optional` **formatters?**: `undefined`

### id

> **id**: `80084`

### name

> **name**: `"Berachain bArtio"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"BERA Token"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"BERA"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://bartio.rpc.berachain.com"`\]

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
