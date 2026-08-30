[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / JsonRpcSimulateV2BlockResult

# Type Alias: JsonRpcSimulateV2BlockResult

> **JsonRpcSimulateV2BlockResult** = `object`

Defined in: [packages/actions/src/eth/EthJsonRpcResponse.ts:551](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L551)

JSON-RPC response block result for eth_simulateV2 (extends V1)

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="basefeepergas"></a> `baseFeePerGas?` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:557](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L557) |
| <a id="calls"></a> `calls` | [`JsonRpcSimulateV2CallResult`](JsonRpcSimulateV2CallResult.md)[] | [packages/actions/src/eth/EthJsonRpcResponse.ts:559](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L559) |
| <a id="feerecipient"></a> `feeRecipient?` | `Address` | [packages/actions/src/eth/EthJsonRpcResponse.ts:558](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L558) |
| <a id="gaslimit"></a> `gasLimit` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:555](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L555) |
| <a id="gasused"></a> `gasUsed` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:556](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L556) |
| <a id="hash"></a> `hash` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:553](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L553) |
| <a id="number"></a> `number` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:552](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L552) |
| <a id="timestamp"></a> `timestamp` | `Hex` | [packages/actions/src/eth/EthJsonRpcResponse.ts:554](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcResponse.ts#L554) |
