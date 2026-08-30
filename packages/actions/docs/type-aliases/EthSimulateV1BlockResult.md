[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSimulateV1BlockResult

# Type Alias: EthSimulateV1BlockResult

> **EthSimulateV1BlockResult** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:417](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L417)

Result of a simulated block containing multiple call results

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="basefeepergas"></a> `baseFeePerGas?` | `bigint` | The base fee per gas for the block | [packages/actions/src/eth/EthResult.ts:441](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L441) |
| <a id="calls"></a> `calls` | [`EthSimulateV1CallResult`](EthSimulateV1CallResult.md)[] | Results of the simulated calls in this block | [packages/actions/src/eth/EthResult.ts:445](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L445) |
| <a id="gaslimit"></a> `gasLimit` | `bigint` | The gas limit of the block | [packages/actions/src/eth/EthResult.ts:433](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L433) |
| <a id="gasused"></a> `gasUsed` | `bigint` | The gas used in the block | [packages/actions/src/eth/EthResult.ts:437](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L437) |
| <a id="hash"></a> `hash` | [`Hex`](Hex.md) | The block hash | [packages/actions/src/eth/EthResult.ts:425](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L425) |
| <a id="number"></a> `number` | `bigint` | The block number | [packages/actions/src/eth/EthResult.ts:421](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L421) |
| <a id="timestamp"></a> `timestamp` | `bigint` | The timestamp of the block | [packages/actions/src/eth/EthResult.ts:429](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L429) |
