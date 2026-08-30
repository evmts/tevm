[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / JsonRpcBlockStateCallV2

# Type Alias: JsonRpcBlockStateCallV2

> **JsonRpcBlockStateCallV2** = `object`

Defined in: [packages/actions/src/eth/EthJsonRpcRequest.ts:442](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcRequest.ts#L442)

A block of calls for simulateV2 (uses V2 transactions)

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="blockoverrides"></a> `blockOverrides?` | [`JsonRpcBlockOverride`](JsonRpcBlockOverride.md) | [packages/actions/src/eth/EthJsonRpcRequest.ts:443](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcRequest.ts#L443) |
| <a id="calls"></a> `calls?` | [`JsonRpcSimulateV2Transaction`](JsonRpcSimulateV2Transaction.md)[] | [packages/actions/src/eth/EthJsonRpcRequest.ts:445](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcRequest.ts#L445) |
| <a id="stateoverrides"></a> `stateOverrides?` | [`JsonRpcStateOverride`](JsonRpcStateOverride.md) | [packages/actions/src/eth/EthJsonRpcRequest.ts:444](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthJsonRpcRequest.ts#L444) |
