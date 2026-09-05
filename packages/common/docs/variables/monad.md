[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / monad

# Variable: monad

> `const` **monad**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"MonadVision"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://monadvision.com"`

#### blockExplorers.monadscan

> `readonly` **monadscan**: `object`

##### Type Declaration

#### blockExplorers.monadscan.apiUrl

> `readonly` **apiUrl**: `"https://api.monadscan.com/api"`

#### blockExplorers.monadscan.name

> `readonly` **name**: `"Monadscan"`

#### blockExplorers.monadscan.url

> `readonly` **url**: `"https://monadscan.com"`

### blockTime

> **blockTime**: `400`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `9248132`

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

> **id**: `143`

### name

> **name**: `"Monad"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Monad"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"MON"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://rpc.monad.xyz"`, `"https://rpc1.monad.xyz"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://rpc.monad.xyz"`, `"wss://rpc1.monad.xyz"`\]

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
