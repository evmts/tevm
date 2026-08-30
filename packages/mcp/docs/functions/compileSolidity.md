[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / compileSolidity

# Function: compileSolidity()

> **compileSolidity**(`input`): `object`

Defined in: [packages/mcp/src/compileSolidity.js:20](https://github.com/evmts/tevm/blob/main/packages/mcp/src/compileSolidity.js#L20)

Compiles one Solidity source file with the bundled solc compiler.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | \{ `contractName?`: `string`; `optimize?`: `boolean`; `source`: `string`; \} | Solidity source and compiler options. |
| `input.contractName?` | `string` | - |
| `input.optimize?` | `boolean` | - |
| `input.source` | `string` | - |

## Returns

`object`

The selected contract artifact.

### abi

> **abi**: `Record`\<`string`, `unknown`\>[]

### bytecode

> **bytecode**: `` `0x${string}` ``

### compilerVersion

> **compilerVersion**: `string`

### contractName

> **contractName**: `string`

### deployedBytecode

> **deployedBytecode**: `` `0x${string}` ``

### warnings

> **warnings**: `string`[]

## Example

```js
import { compileSolidity } from '@tevm/mcp'

const artifact = compileSolidity({
  source: 'contract Counter { uint public count; }',
  contractName: 'Counter',
})
console.log(artifact.bytecode)
```
