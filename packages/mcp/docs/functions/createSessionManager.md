[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / createSessionManager

# Function: createSessionManager()

> **createSessionManager**(`options?`): `object`

Defined in: [packages/mcp/src/createSessionManager.js:34](https://github.com/evmts/tevm/blob/main/packages/mcp/src/createSessionManager.js#L34)

Creates an isolated Tevm session manager with idle expiration.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | \{ `idleTtlMs?`: `number`; `maximumSessions?`: `number`; `now?`: () => `number`; \} | Session limits. |
| `options.idleTtlMs?` | `number` | - |
| `options.maximumSessions?` | `number` | - |
| `options.now?` | () => `number` | - |

## Returns

`object`

A manager whose handles expire after the configured idle lifetime.

### close

> **close**: (`handle`) => `Promise`\<`boolean`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handle` | `string` |

#### Returns

`Promise`\<`boolean`\>

### createFork

> **createFork**: (`input`) => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `blockNumber?`: `string`; `chain?`: `"auto"` \| `"mainnet"` \| `"optimism"` \| `"base"`; `url`: `string`; \} |
| `input.blockNumber?` | `string` |
| `input.chain?` | `"auto"` \| `"mainnet"` \| `"optimism"` \| `"base"` |
| `input.url` | `string` |

#### Returns

`Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

### createLocal

> **createLocal**: () => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

#### Returns

`Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

### get

> **get**: (`handle`) => `MemoryClient`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handle` | `string` |

#### Returns

`MemoryClient`

### size

> **size**: () => `number`

#### Returns

`number`

## Example

```js
import { createSessionManager } from '@tevm/mcp'

const sessions = createSessionManager()
const { handle } = await sessions.createLocal()
const client = sessions.get(handle)
console.log(await client.getBlockNumber())
```
