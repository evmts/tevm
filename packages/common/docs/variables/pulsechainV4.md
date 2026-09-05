[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / pulsechainV4

# Variable: pulsechainV4

> `const` **pulsechainV4**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://scan.v4.testnet.pulsechain.com/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"PulseScan"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://scan.v4.testnet.pulsechain.com"`

### blockTime

> **blockTime**: `10000`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.ensRegistry

> `readonly` **ensRegistry**: `object`

##### Type Declaration

#### contracts.ensRegistry.address

> `readonly` **address**: `"0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xca11bde05977b3631167028862be2a173976ca11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `14353601`

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

> **id**: `943`

### name

> **name**: `"PulseChain V4"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"V4 Pulse"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"v4PLS"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://rpc.v4.testnet.pulsechain.com"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://ws.v4.testnet.pulsechain.com"`\]

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
