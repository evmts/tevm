[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSimulateV1CallResult

# Type Alias: EthSimulateV1CallResult

> **EthSimulateV1CallResult** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:391](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L391)

Result of a single simulated call

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="error"></a> `error?` | [`SimulateCallError`](SimulateCallError.md) | Error information if the call failed | [packages/actions/src/eth/EthResult.ts:411](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L411) |
| <a id="gasused"></a> `gasUsed` | `bigint` | Gas used by the call | [packages/actions/src/eth/EthResult.ts:403](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L403) |
| <a id="logs"></a> `logs` | [`FilterLog`](FilterLog.md)[] | Logs emitted during the call execution | [packages/actions/src/eth/EthResult.ts:399](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L399) |
| <a id="returndata"></a> `returnData` | [`Hex`](Hex.md) | The return data from the call | [packages/actions/src/eth/EthResult.ts:395](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L395) |
| <a id="status"></a> `status` | `bigint` | Status of the call (1 = success, 0 = failure) | [packages/actions/src/eth/EthResult.ts:407](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L407) |
