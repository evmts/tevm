[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / astarZkEVM

# ~~Variable: astarZkEVM~~

> `const` **astarZkEVM**: `object`

## Type Declaration

### ~~blockExplorers~~

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"Astar zkEVM Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://astar-zkevm.explorer.startale.com"`

### ~~blockTime?~~

> `optional` **blockTime?**: `number`

### ~~contracts~~

> **contracts**: `object`

#### Type Declaration

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xca11bde05977b3631167028862be2a173976ca11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `93528`

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

> **id**: `3776`

### ~~name~~

> **name**: `"Astar zkEVM"`

### ~~nativeCurrency~~

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Ether"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"ETH"`

### ~~network~~

> `readonly` **network**: `"AstarZkEVM"`

### ~~prepareTransactionRequest?~~

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### ~~rpcUrls~~

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://rpc-zkevm.astar.network"`\]

### ~~serializers?~~

> `optional` **serializers?**: `ChainSerializers`

### ~~sourceId?~~

> `optional` **sourceId?**: `number`

### ~~testnet~~

> **testnet**: `false`

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
