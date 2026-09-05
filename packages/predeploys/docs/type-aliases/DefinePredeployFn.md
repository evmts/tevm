[**@tevm/predeploys**](../README.md)

***

[@tevm/predeploys](../globals.md) / DefinePredeployFn

# Type Alias: DefinePredeployFn

> **DefinePredeployFn** = \<`TName`, `THumanReadableAbi`\>(`contract`) => [`Predeploy`](Predeploy.md)\<`TName`, `THumanReadableAbi`\>

Defined in: [DefinePredeployFn.ts:30](https://github.com/evmts/tevm/blob/main/packages/predeploys/src/DefinePredeployFn.ts#L30)

Defines an addressed contract whose runtime code can be installed in native state

## Type Parameters

| Type Parameter |
| ------ |
| `TName` *extends* `string` |
| `THumanReadableAbi` *extends* readonly `string`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `contract` | `Contract`\<`TName`, `THumanReadableAbi`, `Address`, `Hex`, `Hex`\> |

## Returns

[`Predeploy`](Predeploy.md)\<`TName`, `THumanReadableAbi`\>

## Example

```ts
import { definePredeploy } from 'tevm/predeploys'
import { createMemoryClient } from 'tevm'
import { createContract } from 'tevm/contract'

const predeploy = definePredeploy(
  createContract({
    name: 'PredeployExample',
    humanReadableAbi: ['function foo() external pure returns (uint256)'],
    bytecode: '0x600a600c600039600a6000f3602a60005260206000f3',
    deployedBytecode: '0x602a60005260206000f3',
  }).withAddress(`0x${'23'.repeat(20)}`),
)

const client = createMemoryClient()
await client.tevmSetAccount({
  address: predeploy.contract.address,
  deployedBytecode: predeploy.contract.deployedBytecode,
})
await client.tevmClose()
```
