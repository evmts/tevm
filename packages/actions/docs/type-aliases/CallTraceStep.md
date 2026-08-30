[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / CallTraceStep

# Type Alias: CallTraceStep

> **CallTraceStep** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:458](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L458)

A single call trace step for V2 debugging

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="depth"></a> `depth` | `number` | The current depth of the call stack | [packages/actions/src/eth/EthResult.ts:478](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L478) |
| <a id="gas"></a> `gas` | `bigint` | The gas remaining | [packages/actions/src/eth/EthResult.ts:470](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L470) |
| <a id="gascost"></a> `gasCost` | `bigint` | The gas cost of this operation | [packages/actions/src/eth/EthResult.ts:474](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L474) |
| <a id="memory"></a> `memory?` | [`Hex`](Hex.md) | The memory contents (if requested) | [packages/actions/src/eth/EthResult.ts:486](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L486) |
| <a id="op"></a> `op` | `string` | The opcode executed | [packages/actions/src/eth/EthResult.ts:462](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L462) |
| <a id="pc"></a> `pc` | `number` | The program counter | [packages/actions/src/eth/EthResult.ts:466](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L466) |
| <a id="stack"></a> `stack?` | [`Hex`](Hex.md)[] | The stack contents (top items) | [packages/actions/src/eth/EthResult.ts:482](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L482) |
