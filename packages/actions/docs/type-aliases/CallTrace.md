[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / CallTrace

# Type Alias: CallTrace

> **CallTrace** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:510](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L510)

Call trace for V2 debugging

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="calls"></a> `calls?` | `CallTrace`[] | Sub-calls made during this call | [packages/actions/src/eth/EthResult.ts:550](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L550) |
| <a id="error"></a> `error?` | `string` | Error message if the call failed | [packages/actions/src/eth/EthResult.ts:546](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L546) |
| <a id="from"></a> `from` | [`Address`](Address.md) | The sender address | [packages/actions/src/eth/EthResult.ts:518](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L518) |
| <a id="gas"></a> `gas` | `bigint` | The gas provided | [packages/actions/src/eth/EthResult.ts:530](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L530) |
| <a id="gasused"></a> `gasUsed` | `bigint` | The gas used | [packages/actions/src/eth/EthResult.ts:534](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L534) |
| <a id="input"></a> `input` | [`Hex`](Hex.md) | The input data | [packages/actions/src/eth/EthResult.ts:538](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L538) |
| <a id="output"></a> `output` | [`Hex`](Hex.md) | The output/return data | [packages/actions/src/eth/EthResult.ts:542](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L542) |
| <a id="to"></a> `to?` | [`Address`](Address.md) | The recipient address (or created contract address) | [packages/actions/src/eth/EthResult.ts:522](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L522) |
| <a id="type"></a> `type` | `string` | The type of call (CALL, DELEGATECALL, STATICCALL, CREATE, CREATE2) | [packages/actions/src/eth/EthResult.ts:514](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L514) |
| <a id="value"></a> `value?` | `bigint` | The value transferred | [packages/actions/src/eth/EthResult.ts:526](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L526) |
