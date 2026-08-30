[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / AnvilSetNextBlockBaseFeePerGasParams

# Type Alias: AnvilSetNextBlockBaseFeePerGasParams

> **AnvilSetNextBlockBaseFeePerGasParams** = `object`

Defined in: [packages/actions/src/anvil/AnvilParams.ts:357](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L357)

Params for `anvil_setNextBlockBaseFeePerGas` handler

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="basefeepergas"></a> `baseFeePerGas` | `readonly` | `bigint` | The base fee per gas to set for the next block (in wei) This is only used for EIP-1559 transactions | [packages/actions/src/anvil/AnvilParams.ts:362](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L362) |
