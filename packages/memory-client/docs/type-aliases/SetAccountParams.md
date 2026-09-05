[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / SetAccountParams

# Type Alias: SetAccountParams

> **SetAccountParams** = `object`

Defined in: packages/actions/dist/index.d.ts:33

Account fields to update in native state. Unspecified fields are preserved.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="address"></a> `address` | `Address` | packages/actions/dist/index.d.ts:34 |
| <a id="balance"></a> `balance?` | `bigint` | packages/actions/dist/index.d.ts:35 |
| <a id="deployedbytecode"></a> `deployedBytecode?` | `Hex` | packages/actions/dist/index.d.ts:37 |
| <a id="nonce"></a> `nonce?` | `bigint` | packages/actions/dist/index.d.ts:36 |
| <a id="storage"></a> `storage?` | `Record`\<`Hex`, `Hex`\> | packages/actions/dist/index.d.ts:38 |
