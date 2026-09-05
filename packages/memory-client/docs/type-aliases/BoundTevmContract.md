[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / BoundTevmContract

# Type Alias: BoundTevmContract

> **BoundTevmContract** = \<`TAbi`, `TName`\>(`params`) => `Promise`\<[`CallResult`](CallResult.md) & `object`\>

Defined in: packages/actions/dist/index.d.ts:71

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
