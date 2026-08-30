[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / createMcpServer

# Function: createMcpServer()

> **createMcpServer**(`options?`): `Server`\<\{ `method`: `string`; `params?`: \{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}; \}, \{ `method`: `string`; `params?`: \{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}; \}, \{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}\>

Defined in: [packages/mcp/src/createMcpServer.js:23](https://github.com/evmts/tevm/blob/main/packages/mcp/src/createMcpServer.js#L23)

Creates the Tevm MCP protocol server and its isolated session store.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | \{ `idleTtlMs?`: `number`; `maximumSessions?`: `number`; \} | Session lifetime and capacity. |
| `options.idleTtlMs?` | `number` | - |
| `options.maximumSessions?` | `number` | - |

## Returns

`Server`\<\{ `method`: `string`; `params?`: \{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}; \}, \{ `method`: `string`; `params?`: \{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}; \}, \{\[`key`: `string`\]: `unknown`; `_meta?`: \{\[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}\>

An unconnected MCP server.

## Example

```js
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from '@tevm/mcp'

const server = createMcpServer()
await server.connect(new StdioServerTransport())
```
