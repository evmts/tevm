[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / toolSchemas

# Variable: toolSchemas

> `const` **toolSchemas**: `Record`\<`string`, `ZodType`\<`any`, `any`, `$ZodTypeInternals`\<`any`, `any`\>\>\>

Defined in: [packages/mcp/src/toolSchemas.js:51](https://github.com/evmts/tevm/blob/main/packages/mcp/src/toolSchemas.js#L51)

Runtime Zod schemas for every exposed MCP tool.

## Example

```js
import { toolSchemas } from '@tevm/mcp'

const input = toolSchemas.evm_mine.parse({ session: crypto.randomUUID() })
console.log(input.blockCount)
```
