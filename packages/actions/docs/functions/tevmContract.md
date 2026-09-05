[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / tevmContract

# Function: tevmContract()

> **tevmContract**\<`TAbi`, `TName`\>(`client`, `params`): `Promise`\<[`CallResult`](../type-aliases/CallResult.md) & `object`\>

Defined in: tevmContract.js:12

ABI-encode a native call and decode its result.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TAbi` *extends* `Abi` |  |
| `TName` *extends* `string` |  |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`RpcClient`](../type-aliases/RpcClient.md) | - |
| `params` | `Omit`\<[`CallParams`](../type-aliases/CallParams.md), `"to"` \| `"data"`\> & `object` | - |

## Returns

`Promise`\<[`CallResult`](../type-aliases/CallResult.md) & `object`\>
