[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createNextApiHandler

# Function: createNextApiHandler()

> **createNextApiHandler**(`client`, `options?`): `NextApiHandler`\<`any`\>

Defined in: [packages/server/src/adapters/createNextApiHandler.js:17](https://github.com/evmts/tevm/blob/main/packages/server/src/adapters/createNextApiHandler.js#L17)

Creates a Next.js API handler for a Tevm JSON-RPC server

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | - |
| `options?` | \{ `cors?`: `boolean`; `maxBatchSize?`: `number`; `maxBodySize?`: `number`; `requestTimeout?`: `number`; \} | HTTP handler options. |
| `options.cors?` | `boolean` | - |
| `options.maxBatchSize?` | `number` | - |
| `options.maxBodySize?` | `number` | - |
| `options.requestTimeout?` | `number` | - |

## Returns

`NextApiHandler`\<`any`\>

## Example

```typescript
import { createNextApiHandler } from 'tevm/server'
import { createMemoryClient } from 'tevm'

const tevm = createMemoryClient()
export default createNextApiHandler(tevm)
```
