[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / toolDefinitions

# Variable: toolDefinitions

> `const` **toolDefinitions**: `object`[]

Defined in: [packages/mcp/src/toolDefinitions.js:48](https://github.com/evmts/tevm/blob/main/packages/mcp/src/toolDefinitions.js#L48)

MCP tool metadata with agent-oriented names, descriptions, and JSON Schemas.

## Type Declaration

### description

> **description**: `string`

### inputSchema

> **inputSchema**: `Record`\<`string`, `unknown`\>

### name

> **name**: `string`

## Example

```js
import { toolDefinitions } from '@tevm/mcp'

console.log(toolDefinitions.map((tool) => tool.name))
```
