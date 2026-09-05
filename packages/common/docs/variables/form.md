[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / form

# Variable: form

> `const` **form**: `object`

## Type Declaration

### blockExplorers

> **blockExplorers**: `object`

#### Type Declaration

#### blockExplorers.default

> `readonly` **default**: `object`

##### Type Declaration

#### blockExplorers.default.name

> `readonly` **name**: `"Form Explorer"`

#### blockExplorers.default.url

> `readonly` **url**: `"https://explorer.form.network"`

### blockTime?

> `optional` **blockTime?**: `number`

### contracts

> **contracts**: `object`

#### Type Declaration

#### contracts.addressManager

> `readonly` **addressManager**: `object`

##### Type Declaration

#### contracts.addressManager.1

> `readonly` **1**: `object`

##### Type Declaration

#### contracts.addressManager.1.address

> `readonly` **address**: `"0x15c249E46A2F924C2dB3A1560CF86729bAD1f07B"`

#### contracts.gasPriceOracle

> `readonly` **gasPriceOracle**: `object`

##### Type Declaration

#### contracts.gasPriceOracle.address

> `readonly` **address**: `"0x420000000000000000000000000000000000000F"`

#### contracts.l1Block

> `readonly` **l1Block**: `object`

##### Type Declaration

#### contracts.l1Block.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000015"`

#### contracts.l1CrossDomainMessenger

> `readonly` **l1CrossDomainMessenger**: `object`

##### Type Declaration

#### contracts.l1CrossDomainMessenger.1

> `readonly` **1**: `object`

##### Type Declaration

#### contracts.l1CrossDomainMessenger.1.address

> `readonly` **address**: `"0xF333158DCCad1dF6C3F0a3aEe8BC31fA94d9eD5c"`

#### contracts.l1StandardBridge

> `readonly` **l1StandardBridge**: `object`

##### Type Declaration

#### contracts.l1StandardBridge.1

> `readonly` **1**: `object`

##### Type Declaration

#### contracts.l1StandardBridge.1.address

> `readonly` **address**: `"0xdc20aA63D3DE59574E065957190D8f24e0F7B8Ba"`

#### contracts.l2CrossDomainMessenger

> `readonly` **l2CrossDomainMessenger**: `object`

##### Type Declaration

#### contracts.l2CrossDomainMessenger.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000007"`

#### contracts.l2Erc721Bridge

> `readonly` **l2Erc721Bridge**: `object`

##### Type Declaration

#### contracts.l2Erc721Bridge.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000014"`

#### contracts.l2OutputOracle

> `readonly` **l2OutputOracle**: `object`

##### Type Declaration

#### contracts.l2OutputOracle.1

> `readonly` **1**: `object`

##### Type Declaration

#### contracts.l2OutputOracle.1.address

> `readonly` **address**: `"0x4ccAAF69F41c5810cA875183648B577CaCf1F67E"`

#### contracts.l2StandardBridge

> `readonly` **l2StandardBridge**: `object`

##### Type Declaration

#### contracts.l2StandardBridge.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000010"`

#### contracts.l2ToL1MessagePasser

> `readonly` **l2ToL1MessagePasser**: `object`

##### Type Declaration

#### contracts.l2ToL1MessagePasser.address

> `readonly` **address**: `"0x4200000000000000000000000000000000000016"`

#### contracts.multicall3

> `readonly` **multicall3**: `object`

##### Type Declaration

#### contracts.multicall3.address

> `readonly` **address**: `"0xcA11bde05977b3631167028862bE2a173976CA11"`

#### contracts.portal

> `readonly` **portal**: `object`

##### Type Declaration

#### contracts.portal.1

> `readonly` **1**: `object`

##### Type Declaration

#### contracts.portal.1.address

> `readonly` **address**: `"0x4E259Ee5F4136408908160dD32295A5031Fa426F"`

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

> **id**: `478`

### name

> **name**: `"Form Network"`

### nativeCurrency

> **nativeCurrency**: `object`

#### Type Declaration

#### nativeCurrency.decimals

> `readonly` **decimals**: `18`

#### nativeCurrency.name

> `readonly` **name**: `"Ethereum"`

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

> `readonly` **http**: readonly \[`"https://rpc.form.network/http"`\]

#### rpcUrls.default.webSocket

> `readonly` **webSocket**: readonly \[`"wss://rpc.form.network/ws"`\]

### serializers?

> `optional` **serializers?**: `ChainSerializers`

### sourceId

> **sourceId**: `1`

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
