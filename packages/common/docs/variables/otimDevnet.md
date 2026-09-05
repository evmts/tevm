[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / otimDevnet

# Variable: otimDevnet

> `const` **otimDevnet**: `object`

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

#### contracts.batchInvoker

> `readonly` **batchInvoker**: `object`

##### Type Declaration

#### contracts.batchInvoker.address

> `readonly` **address**: `"0x5FbDB2315678afecb367f032d93F642f64180aa3"`

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

> **id**: `41144114`

### name

> **name**: `"Otim Devnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"ETH"`

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

> `readonly` **http**: readonly \[`"http://devnet.otim.xyz"`\]

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
