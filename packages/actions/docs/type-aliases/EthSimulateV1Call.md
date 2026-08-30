[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSimulateV1Call

# Type Alias: EthSimulateV1Call

> **EthSimulateV1Call** = `object`

Defined in: [packages/actions/src/eth/EthParams.ts:407](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L407)

Parameters for a single simulated call within a block

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="data"></a> `data?` | `readonly` | [`Hex`](Hex.md) | The hash of the method signature and encoded parameters | [packages/actions/src/eth/EthParams.ts:439](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L439) |
| <a id="from"></a> `from?` | `readonly` | [`Address`](Address.md) | The address from which the transaction is sent | [packages/actions/src/eth/EthParams.ts:411](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L411) |
| <a id="gas"></a> `gas?` | `readonly` | `bigint` | The integer of gas provided for the transaction execution | [packages/actions/src/eth/EthParams.ts:419](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L419) |
| <a id="gasprice"></a> `gasPrice?` | `readonly` | `bigint` | The integer of gasPrice used for each paid gas | [packages/actions/src/eth/EthParams.ts:423](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L423) |
| <a id="maxfeepergas"></a> `maxFeePerGas?` | `readonly` | `bigint` | The max fee per gas (EIP-1559) | [packages/actions/src/eth/EthParams.ts:427](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L427) |
| <a id="maxpriorityfeepergas"></a> `maxPriorityFeePerGas?` | `readonly` | `bigint` | The max priority fee per gas (EIP-1559) | [packages/actions/src/eth/EthParams.ts:431](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L431) |
| <a id="nonce"></a> `nonce?` | `readonly` | `bigint` | The nonce of the transaction | [packages/actions/src/eth/EthParams.ts:443](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L443) |
| <a id="to"></a> `to?` | `readonly` | [`Address`](Address.md) | The address to which the transaction is addressed | [packages/actions/src/eth/EthParams.ts:415](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L415) |
| <a id="value"></a> `value?` | `readonly` | `bigint` | The integer of value sent with this transaction | [packages/actions/src/eth/EthParams.ts:435](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L435) |
