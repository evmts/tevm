[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / statusSepolia

# Variable: statusSepolia

> `const` **statusSepolia**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"Blockscout"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://sepoliascan.status.network"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xca11bde05977b3631167028862be2a173976ca11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `1578364`

### custom?

> `optional` **custom?**: `Record`\<`string`, `unknown`\>

### ensTlds?

> `optional` **ensTlds?**: readonly `string`[]

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

> **id**: `1660990954`

### name

> **name**: `"Status Network Sepolia"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Ether"`

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

> `readonly` **http**: readonly \[`"https://public.sepolia.rpc.status.network"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://public.sepolia.rpc.status.network/ws"`\]

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
