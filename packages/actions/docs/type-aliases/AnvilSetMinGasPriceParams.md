[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / AnvilSetMinGasPriceParams

# Type Alias: AnvilSetMinGasPriceParams

> **AnvilSetMinGasPriceParams** = `object`

Defined in: [packages/actions/src/anvil/AnvilParams.ts:369](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L369)

Params for `anvil_setMinGasPrice` handler

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="mingasprice"></a> `minGasPrice` | `readonly` | `bigint` | The minimum gas price to accept for transactions (in wei) Transactions with a gas price below this value will be rejected | [packages/actions/src/anvil/AnvilParams.ts:374](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L374) |
