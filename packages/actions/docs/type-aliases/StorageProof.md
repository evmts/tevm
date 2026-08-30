[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / StorageProof

# Type Alias: StorageProof

> **StorageProof** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:319](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L319)

Storage proof for a single storage slot

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="key"></a> `key` | [`Hex`](Hex.md) | The key of the storage slot | [packages/actions/src/eth/EthResult.ts:323](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L323) |
| <a id="proof"></a> `proof` | [`Hex`](Hex.md)[] | The merkle proof for this storage slot | [packages/actions/src/eth/EthResult.ts:331](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L331) |
| <a id="value"></a> `value` | [`Hex`](Hex.md) | The value of the storage slot | [packages/actions/src/eth/EthResult.ts:327](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L327) |
