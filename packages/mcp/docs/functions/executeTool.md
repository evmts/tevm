[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / executeTool

# Function: executeTool()

> **executeTool**(`name`, `input`, `sessions`): `Promise`\<`unknown`\>

Defined in: [packages/mcp/src/executeTool.js:115](https://github.com/evmts/tevm/blob/main/packages/mcp/src/executeTool.js#L115)

Executes one validated Tevm MCP tool against an isolated session manager.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | MCP tool name. |
| `input` | `unknown` | Untrusted MCP tool arguments. |
| `sessions` | \{ `close`: (`handle`) => `Promise`\<`boolean`\>; `createFork`: (`input`) => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>; `createLocal`: () => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>; `get`: (`handle`) => `MemoryClient`; `size`: () => `number`; \} | Session manager. |
| `sessions.close` | (`handle`) => `Promise`\<`boolean`\> | - |
| `sessions.createFork` | (`input`) => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\> | - |
| `sessions.createLocal` | () => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\> | - |
| `sessions.get` | (`handle`) => `MemoryClient` | - |
| `sessions.size` | () => `number` | - |

## Returns

`Promise`\<`unknown`\>

A JSON-safe tool result.

## Example

```js
import { createSessionManager, executeTool } from '@tevm/mcp'

const sessions = createSessionManager()
const result = await executeTool('evm_create_session', {}, sessions)
console.log(result.handle)
```
