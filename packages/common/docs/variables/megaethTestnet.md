[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / megaethTestnet

# Variable: megaethTestnet

> `const` **megaethTestnet**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.blockscout

> `readonly` **blockscout**: `object`

##### Type Declaration

#### blockExplorers.blockscout.apiUrl

> `readonly` **apiUrl**: `"https://megaeth-testnet-v2.blockscout.com/api"`

#### blockExplorers.blockscout.name

> `readonly` **name**: `"Blockscout"`

#### blockExplorers.blockscout.url

> `readonly` **url**: `"https://megaeth-testnet-v2.blockscout.com"`

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.apiUrl

> `readonly` **apiUrl**: `"https://api.etherscan.io/v2/api"`

#### blockExplorers.default.name

> `readonly` **name**: `"Etherscan"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://testnet-mega.etherscan.io"`

### blockTime

> **blockTime**: `1000`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.multicall3.blockCreated

> `readonly` **blockCreated**: `0`

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

> **id**: `6343`

### name

> **name**: `"MegaETH Testnet"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"MegaETH Testnet Ether"`

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

> `readonly` **http**: readonly \[`"https://carrot.megaeth.com/rpc"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://carrot.megaeth.com/ws"`\]

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
