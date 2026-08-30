[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / AnvilAddBalanceParams

# Type Alias: AnvilAddBalanceParams

> **AnvilAddBalanceParams** = `object`

Defined in: [packages/actions/src/anvil/AnvilParams.ts:297](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L297)

Params for `anvil_addBalance` handler

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="address"></a> `address` | `readonly` | [`Address`](Address.md) | The address to add balance to | [packages/actions/src/anvil/AnvilParams.ts:301](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L301) |
| <a id="amount"></a> `amount` | `readonly` | [`Hex`](Hex.md) \| `BigInt` | The amount to add to the balance | [packages/actions/src/anvil/AnvilParams.ts:305](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/AnvilParams.ts#L305) |
