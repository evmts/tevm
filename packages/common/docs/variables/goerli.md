[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / goerli

# Variable: goerli

> `const` **goerli**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://api-goerli.etherscan.io/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Etherscan"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://goerli.etherscan.io"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.ensRegistry

> `readonly` **ensRegistry**: `object`

##### Type Declaration

#### contracts.ensRegistry.address

> `readonly` **address**: `"0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"`

#### contracts.ensUniversalResolver

> `readonly` **ensUniversalResolver**: `object`

##### Type Declaration

#### contracts.ensUniversalResolver.address

> `readonly` **address**: `"0xfc4AC75C46C914aF5892d6d3eFFcebD7917293F1"`

#### contracts.ensUniversalResolver.blockCreated

> `readonly` **blockCreated**: `10339206`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xca11bde05977b3631167028862be2a173976ca11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `6507670`

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

> **id**: `5`

### name

> **name**: `"Goerli"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Goerli Ether"`

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

> `readonly` **http**: readonly \[`"https://5.rpc.thirdweb.com"`\]

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
