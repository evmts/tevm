[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / tevmContract

# Function: tevmContract()

> **tevmContract**\<`TAbi`, `TName`\>(`client`, `params`): `Promise`\<[`CallResult`](../type-aliases/CallResult.md) & `object`\>

Defined in: packages/actions/dist/index.d.ts:90

## Type Parameters

| Type Parameter |
| ------ |
| `TAbi` *extends* `Abi` |
| `TName` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | [`RpcClient`](../type-aliases/RpcClient.md) |
| `params` | `Omit`\<[`CallParams`](../type-aliases/CallParams.md), `"to"` \| `"data"`\> & `object` |

## Returns

`Promise`\<[`CallResult`](../type-aliases/CallResult.md) & `object`\>
