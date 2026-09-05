[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / lineaSepolia

# Variable: lineaSepolia

> `const` **lineaSepolia**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://api-sepolia.lineascan.build/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Etherscan"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://sepolia.lineascan.build"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.ensRegistry

> `readonly` **ensRegistry**: `object`

##### Type Declaration

#### contracts.ensRegistry.address

> `readonly` **address**: `"0x5B2636F0f2137B4aE722C01dd5122D7d3e9541f7"`

#### contracts.ensRegistry.blockCreated

> `readonly` **blockCreated**: `2395094`

#### contracts.ensUniversalResolver

> `readonly` **ensUniversalResolver**: `object`

##### Type Declaration

#### contracts.ensUniversalResolver.address

> `readonly` **address**: `"0x4D41762915F83c76EcaF6776d9b08076aA32b492"`

#### contracts.ensUniversalResolver.blockCreated

> `readonly` **blockCreated**: `17168484`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xca11bde05977b3631167028862be2a173976ca11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `227427`

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

> **id**: `59141`

### name

> **name**: `"Linea Sepolia Testnet"`

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

> `readonly` **http**: readonly \[`"https://rpc.sepolia.linea.build"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://rpc.sepolia.linea.build"`\]

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
