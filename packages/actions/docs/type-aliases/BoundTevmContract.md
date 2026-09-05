[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / BoundTevmContract

# Type Alias: BoundTevmContract

> **BoundTevmContract** = \<`TAbi`, `TName`\>(`params`) => `Promise`\<[`CallResult`](CallResult.md) & `object`\>

Defined in: BoundTevmContract.ts:5

A contract action bound to a native client.

## Type Parameters

| Type Parameter |
| ------ |
| `TAbi` *extends* `Abi` |
| `TName` *extends* `ContractFunctionName`\<`TAbi`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `Omit`\<[`CallParams`](CallParams.md), `"to"` \| `"data"`\> & `object` |

## Returns

`Promise`\<[`CallResult`](CallResult.md) & `object`\>
