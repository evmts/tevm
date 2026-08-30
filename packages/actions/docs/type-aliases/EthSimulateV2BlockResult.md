[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSimulateV2BlockResult

# Type Alias: EthSimulateV2BlockResult

> **EthSimulateV2BlockResult** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:579](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L579)

Result of a simulated block containing multiple call results (V2)
Extends V1 with streamlined output

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="basefeepergas"></a> `baseFeePerGas?` | `bigint` | The base fee per gas for the block | [packages/actions/src/eth/EthResult.ts:603](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L603) |
| <a id="calls"></a> `calls` | [`EthSimulateV2CallResult`](EthSimulateV2CallResult.md)[] | Results of the simulated calls in this block | [packages/actions/src/eth/EthResult.ts:611](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L611) |
| <a id="feerecipient"></a> `feeRecipient?` | [`Address`](Address.md) | The fee recipient (coinbase) | [packages/actions/src/eth/EthResult.ts:607](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L607) |
| <a id="gaslimit"></a> `gasLimit` | `bigint` | The gas limit of the block | [packages/actions/src/eth/EthResult.ts:595](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L595) |
| <a id="gasused"></a> `gasUsed` | `bigint` | The gas used in the block | [packages/actions/src/eth/EthResult.ts:599](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L599) |
| <a id="hash"></a> `hash` | [`Hex`](Hex.md) | The block hash | [packages/actions/src/eth/EthResult.ts:587](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L587) |
| <a id="number"></a> `number` | `bigint` | The block number | [packages/actions/src/eth/EthResult.ts:583](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L583) |
| <a id="timestamp"></a> `timestamp` | `bigint` | The timestamp of the block | [packages/actions/src/eth/EthResult.ts:591](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L591) |
