[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / Common

# Type Alias: Common\<formatters, extendSchema\>

> **Common**\<`formatters`, `extendSchema`\> = `object` & `ChainConfig`\<`formatters`, `extendSchema`\>

## Type Declaration

### blockExplorers?

> `optional` **blockExplorers?**: `object`

Collection of block explorers

#### Type Declaration

#### Index Signature

\[`key`: `string`\]: `ChainBlockExplorer`

#### blockExplorers.default

> **default**: `ChainBlockExplorer`

### blockTime?

> `optional` **blockTime?**: `number`

Block time in milliseconds.

### contracts?

> `optional` **contracts?**: [`Prettify`](Prettify.md)\<`object` & `object`\>

Collection of contracts

### ensTlds?

> `optional` **ensTlds?**: readonly `string`[]

Collection of ENS TLDs for the chain.

### experimental\_preconfirmationTime?

> `optional` **experimental\_preconfirmationTime?**: `number`

Preconfirmation time in milliseconds.

### id

> **id**: `number`

ID in number form

### name

> **name**: `string`

Human-readable name

### nativeCurrency

> **nativeCurrency**: `ChainNativeCurrency`

Currency used by chain

### rpcUrls

> **rpcUrls**: `object`

Collection of RPC endpoints

#### Type Declaration

#### Index Signature

\[`key`: `string`\]: `ChainRpcUrls`

#### rpcUrls.default

> **default**: `ChainRpcUrls`

### sourceId?

> `optional` **sourceId?**: `number`

Source Chain ID (ie. the L1 chain)

### testnet?

> `optional` **testnet?**: `boolean`

Flag for test networks

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `formatters` *extends* `ChainFormatters` \| `undefined` | `ChainFormatters` \| `undefined` |
| `extendSchema` *extends* `Record`\<`string`, `unknown`\> \| `undefined` | `Record`\<`string`, `unknown`\> \| `undefined` |
