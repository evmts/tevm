[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSimulateV1Params

# Type Alias: EthSimulateV1Params

> **EthSimulateV1Params** = `object`

Defined in: [packages/actions/src/eth/EthParams.ts:468](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L468)

Based on the JSON-RPC request for `eth_simulateV1` procedure
Allows simulation of multiple transactions across multiple blocks with state overrides

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="blockstatecalls"></a> `blockStateCalls` | `readonly` | readonly [`EthSimulateV1BlockStateCall`](EthSimulateV1BlockStateCall.md)[] | Array of block state calls to simulate. Each block can have its own state overrides and multiple calls. | [packages/actions/src/eth/EthParams.ts:473](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L473) |
| <a id="blocktag"></a> `blockTag?` | `readonly` | [`BlockParam`](BlockParam.md) | The block number or tag to execute the simulation against | [packages/actions/src/eth/EthParams.ts:489](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L489) |
| <a id="returnfulltransactions"></a> `returnFullTransactions?` | `readonly` | `boolean` | Whether to return full transaction objects in the response | [packages/actions/src/eth/EthParams.ts:485](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L485) |
| <a id="tracetransfers"></a> `traceTransfers?` | `readonly` | `boolean` | Whether to trace ETH transfers | [packages/actions/src/eth/EthParams.ts:477](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L477) |
| <a id="validation"></a> `validation?` | `readonly` | `boolean` | Whether to validate transactions (check signatures, nonces, etc.) | [packages/actions/src/eth/EthParams.ts:481](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L481) |
