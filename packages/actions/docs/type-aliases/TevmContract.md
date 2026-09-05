[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / TevmContract

# Type Alias: TevmContract

> **TevmContract** = \<`TAbi`, `TName`\>(`client`, `params`) => `Promise`\<[`CallResult`](CallResult.md) & `object`\>

Defined in: TevmActions.ts:43

ABI-aware contract call preserving the function's return type.

## Type Parameters

| Type Parameter |
| ------ |
| `TAbi` *extends* `Abi` |
| `TName` *extends* `ContractFunctionName`\<`TAbi`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | [`RpcClient`](RpcClient.md) |
| `params` | `Omit`\<[`CallParams`](CallParams.md), `"to"` \| `"data"`\> & `object` |

## Returns

`Promise`\<[`CallResult`](CallResult.md) & `object`\>
