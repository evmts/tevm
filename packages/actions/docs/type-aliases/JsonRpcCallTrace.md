[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / JsonRpcCallTrace

# Type Alias: JsonRpcCallTrace

> **JsonRpcCallTrace** = `object`

Defined in: [packages/actions/src/eth/EthJsonRpcResponse.ts:513](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L513)

JSON-RPC call trace for eth_simulateV2

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="calls"></a> `calls?` | `JsonRpcCallTrace`[] | Sub-calls | [packages/actions/src/eth/EthJsonRpcResponse.ts:533](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L533) |
| <a id="error"></a> `error?` | `string` | Error message if call failed | [packages/actions/src/eth/EthJsonRpcResponse.ts:531](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L531) |
| <a id="from"></a> `from` | `Address` | Sender address | [packages/actions/src/eth/EthJsonRpcResponse.ts:517](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L517) |
| <a id="gas"></a> `gas` | `Hex` | Gas provided | [packages/actions/src/eth/EthJsonRpcResponse.ts:523](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L523) |
| <a id="gasused"></a> `gasUsed` | `Hex` | Gas used | [packages/actions/src/eth/EthJsonRpcResponse.ts:525](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L525) |
| <a id="input"></a> `input` | `Hex` | Input data | [packages/actions/src/eth/EthJsonRpcResponse.ts:527](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L527) |
| <a id="output"></a> `output` | `Hex` | Output data | [packages/actions/src/eth/EthJsonRpcResponse.ts:529](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L529) |
| <a id="to"></a> `to?` | `Address` | Recipient or created contract address | [packages/actions/src/eth/EthJsonRpcResponse.ts:519](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L519) |
| <a id="type"></a> `type` | `string` | Call type (CALL, DELEGATECALL, STATICCALL, CREATE, CREATE2) | [packages/actions/src/eth/EthJsonRpcResponse.ts:515](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L515) |
| <a id="value"></a> `value?` | `Hex` | Value transferred | [packages/actions/src/eth/EthJsonRpcResponse.ts:521](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L521) |
