[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / humanodeTestnet5

# Variable: humanodeTestnet5

> `const` **humanodeTestnet5**: `object`

## Type Declaration

### blockExplorers?

> `optional` **blockExplorers?**: `object`

#### Type Declaration

#### Index Signature

\[`key`: `string`\]: `object`

#### blockExplorers.default

> **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl?

> `optional` **apiUrl?**: `string`

#### blockExplorers.default.name

> **name**: `string`

#### blockExplorers.default.url

> **url**: `string`

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

> **id**: `14853`

### name

> **name**: `"Humanode Testnet 5"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"HMND"`

#### nativeCurrency.symbol

> `readonly` **symbol**: `"HMND"`

### prepareTransactionRequest?

> `optional` **prepareTransactionRequest?**: ((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| \[((`args`, `options`) => `Promise`\<`PrepareTransactionRequestParameters`\>) \| `undefined`, `object`\]

### rpcUrls

> **rpcUrls**: `object`

#### Type Declaration

#### rpcUrls.default

> `readonly` **default**: `object`

##### Type Declaration

#### rpcUrls.default.http

> `readonly` **http**: readonly \[`"https://explorer-rpc-http.testnet5.stages.humanode.io"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://explorer-rpc-ws.testnet5.stages.humanode.io"`\]

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
