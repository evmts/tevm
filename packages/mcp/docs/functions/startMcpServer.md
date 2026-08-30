[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / startMcpServer

# Function: startMcpServer()

> **startMcpServer**(`options?`): `Promise`\<`void`\>

Defined in: [packages/mcp/src/startMcpServer.js:17](https://github.com/evmts/tevm/blob/main/packages/mcp/src/startMcpServer.js#L17)

Starts the Tevm MCP server over standard input and output.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | \{ `idleTtlMs?`: `number`; `maximumSessions?`: `number`; \} | Session lifetime and capacity. |
| `options.idleTtlMs?` | `number` | - |
| `options.maximumSessions?` | `number` | - |

## Returns

`Promise`\<`void`\>

Resolves after the stdio transport is connected.

## Example

```js
import { startMcpServer } from '@tevm/mcp'

await startMcpServer()
```
