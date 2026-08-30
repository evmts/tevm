[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSimulateV2BlockStateCall

# Type Alias: EthSimulateV2BlockStateCall

> **EthSimulateV2BlockStateCall** = `object`

Defined in: [packages/actions/src/eth/EthParams.ts:509](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L509)

A block of calls to simulate with optional block and state overrides (V2)
Extends V1 with additional tracing options

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="blockoverrides"></a> `blockOverrides?` | `readonly` | [`BlockOverrideSet`](BlockOverrideSet.md) | Block header fields to override for this simulated block | [packages/actions/src/eth/EthParams.ts:513](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L513) |
| <a id="calls"></a> `calls` | `readonly` | readonly [`EthSimulateV2Call`](EthSimulateV2Call.md)[] | Calls to simulate in this block | [packages/actions/src/eth/EthParams.ts:521](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L521) |
| <a id="stateoverrides"></a> `stateOverrides?` | `readonly` | [`StateOverrideSet`](StateOverrideSet.md) | State to override before executing this block's calls | [packages/actions/src/eth/EthParams.ts:517](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L517) |
