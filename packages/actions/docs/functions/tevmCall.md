[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / tevmCall

# Function: tevmCall()

> **tevmCall**(`client`, `params`): `Promise`\<[`CallResult`](../type-aliases/CallResult.md)\>

Defined in: tevmCall.js:10

Simulate an EVM call, or submit and optionally mine a native transaction.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`RpcClient`](../type-aliases/RpcClient.md) | - |
| `params` | [`CallParams`](../type-aliases/CallParams.md) | - |

## Returns

`Promise`\<[`CallResult`](../type-aliases/CallResult.md)\>

## Throws

Native RPC error, including revert data, on failure.
