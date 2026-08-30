[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / JsonRpcSimulateCallResult

# Type Alias: JsonRpcSimulateCallResult

> **JsonRpcSimulateCallResult** = `object`

Defined in: [packages/actions/src/eth/EthJsonRpcResponse.ts:465](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L465)

JSON-RPC response call result for eth_simulateV1

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="error"></a> `error?` | `object` | [packages/actions/src/eth/EthJsonRpcResponse.ts:470](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L470) |
| `error.code` | `number` | [packages/actions/src/eth/EthJsonRpcResponse.ts:471](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L471) |
| `error.data?` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:473](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L473) |
| `error.message` | `string` | [packages/actions/src/eth/EthJsonRpcResponse.ts:472](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L472) |
| <a id="gasused"></a> `gasUsed` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:468](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L468) |
| <a id="logs"></a> `logs` | `SerializeToJson`\<[`FilterLog`](FilterLog.md)\>[] | [packages/actions/src/eth/EthJsonRpcResponse.ts:467](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L467) |
| <a id="returndata"></a> `returnData` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:466](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L466) |
| <a id="status"></a> `status` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:469](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L469) |
