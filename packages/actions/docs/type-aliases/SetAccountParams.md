[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / SetAccountParams

# Type Alias: SetAccountParams

> **SetAccountParams** = `object`

Defined in: TevmActions.ts:25

Account fields to update in native state. Unspecified fields are preserved.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="address"></a> `address` | `Address` | TevmActions.ts:26 |
| <a id="balance"></a> `balance?` | `bigint` | TevmActions.ts:27 |
| <a id="deployedbytecode"></a> `deployedBytecode?` | `Hex` | TevmActions.ts:29 |
| <a id="nonce"></a> `nonce?` | `bigint` | TevmActions.ts:28 |
| <a id="storage"></a> `storage?` | `Record`\<`Hex`, `Hex`\> | TevmActions.ts:30 |
