[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / tevmSetAccount

# Function: tevmSetAccount()

> **tevmSetAccount**(`client`, `params`): `Promise`\<`void`\>

Defined in: tevmSetAccount.js:10

Update specified account fields using native development controls.
Each field is an individual native mutation; use snapshots for grouped rollback.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`RpcClient`](../type-aliases/RpcClient.md) | - |
| `params` | [`SetAccountParams`](../type-aliases/SetAccountParams.md) | - |

## Returns

`Promise`\<`void`\>
