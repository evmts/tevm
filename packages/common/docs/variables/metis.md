[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / metis

# Variable: metis

> `const` **metis**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://api.routescan.io/v2/network/mainnet/evm/1088/etherscan/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Metis Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://explorer.metis.io"`

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

> `readonly` **blockCreated**: `2338552`

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

> **id**: `1088`

### name

> **name**: `"Metis"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Metis"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"METIS"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://metis.rpc.hypersync.xyz"`, `"https://metis-pokt.nodies.app"`, `"https://api.blockeden.xyz/metis/67nCBdZQSH9z3YqDDjdm"`, `"https://metis-andromeda.rpc.thirdweb.com"`, `"https://metis-andromeda.gateway.tenderly.co"`, `"https://metis.api.onfinality.io/public"`, `"https://andromeda.metis.io/?owner=1088"`, `"https://metis-mainnet.public.blastapi.io"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://metis-rpc.publicnode.com"`, `"wss://metis.drpc.org"`\]

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
