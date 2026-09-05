[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / linea

# Variable: linea

> `const` **linea**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://api.lineascan.build/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Etherscan"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://lineascan.build"`

### blockTime

> **blockTime**: `2000`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.ensRegistry

> `readonly` **ensRegistry**: `object`

##### Type Declaration

#### contracts.ensRegistry.address

> `readonly` **address**: `"0x50130b669B28C339991d8676FA73CF122a121267"`

#### contracts.ensRegistry.blockCreated

> `readonly` **blockCreated**: `6682888`

#### contracts.ensUniversalResolver

> `readonly` **ensUniversalResolver**: `object`

##### Type Declaration

#### contracts.ensUniversalResolver.address

> `readonly` **address**: `"0x4D41762915F83c76EcaF6776d9b08076aA32b492"`

#### contracts.ensUniversalResolver.blockCreated

> `readonly` **blockCreated**: `22222151`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `42`

### custom?

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ensTlds

> **ensTlds**: readonly \[`".linea.eth"`\]

### experimental\_preconfirmationTime?

> `optional` **experimental\_preconfirmationTime?**: `number`

### extendSchema?

> `optional` **extendSchema?**: `Record`\<`string`, `unknown`\>

### fees

> **fees**: `object`

#### Type Declaration

#### fees.estimateFeesPerGas

> `readonly` **estimateFeesPerGas**: (`{ client, multiply, request, type, }`) => `ReturnType`\<`ChainEstimateFeesPerGasFn`\>

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `{ client, multiply, request, type, }` | `Parameters`\<`ChainEstimateFeesPerGasFn`\>\[`0`\] |

##### Returns

`ReturnType`\<`ChainEstimateFeesPerGasFn`\>

#### fees.maxPriorityFeePerGas

> `readonly` **maxPriorityFeePerGas**: (`{ block, client, request }`) => `Promise`\<`bigint` \| `null`\>

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `{ block, client, request }` | `ChainFeesFnParameters` |

##### Returns

`Promise`\<`bigint` \| `null`\>

### formatters?

> `optional` **formatters?**: `undefined`

### id

> **id**: `59144`

### name

> **name**: `"Linea Mainnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Linea Ether"`

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

> `readonly` **http**: readonly \[`"https://rpc.linea.build"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://rpc.linea.build"`\]

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
