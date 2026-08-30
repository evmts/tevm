[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / toJsonValue

# Function: toJsonValue()

> **toJsonValue**(`value`): `unknown`

Defined in: [packages/mcp/src/toJsonValue.js:15](https://github.com/evmts/tevm/blob/main/packages/mcp/src/toJsonValue.js#L15)

Converts Tevm and viem values into JSON-safe data without losing integer precision.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | Any value returned by Tevm, viem, or solc. |

## Returns

`unknown`

A JSON-safe value.

## Example

```js
import { toJsonValue } from '@tevm/mcp'

console.log(toJsonValue({ gasUsed: 21000n }))
// { gasUsed: "21000" }
```
