[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / tevmCall

# Function: tevmCall()

> **tevmCall**(`client`, `params`): `Promise`\<[`CallResult`](../type-aliases/CallResult.md)\>

Defined in: [packages/actions/src/tevmCall.js:11](https://github.com/evmts/tevm/blob/main/packages/actions/src/tevmCall.js#L11)

Simulate an EVM call, or submit and optionally mine a native transaction.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`RpcClient`](../type-aliases/RpcClient.md) | - |
| `params` | [`CallParams`](../type-aliases/CallParams.md) | - |

## Returns

`Promise`\<[`CallResult`](../type-aliases/CallResult.md)\>

## Throws

Native RPC diagnostic on failure. If a submitted transaction stays pending after mining or its
receipt indicates a revert, the error includes the submitted txHash and any reverted receipt.
