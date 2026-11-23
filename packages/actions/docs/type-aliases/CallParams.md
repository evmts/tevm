[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / CallParams

# Type Alias: CallParams

> **CallParams** = `object`

Defined in: [packages/actions/src/TevmActions.ts:7](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L7)

Native call parameters. State overrides use the standard eth_call wire shape.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="addtoblockchain"></a> `addToBlockchain?` | `boolean` | Require a mined, successful receipt. A pending or reverted transaction throws with its hash. | [packages/actions/src/TevmActions.ts:23](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L23) |
| <a id="addtomempool"></a> `addToMempool?` | `boolean` | - | [packages/actions/src/TevmActions.ts:21](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L21) |
| <a id="blocktag"></a> `blockTag?` | `string` | - | [packages/actions/src/TevmActions.ts:17](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L17) |
| <a id="code"></a> `code?` | `Hex` | Runtime bytecode to simulate at the destination. Addressless simulations use the zero address. | [packages/actions/src/TevmActions.ts:19](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L19) |
| <a id="data"></a> `data?` | `Hex` | - | [packages/actions/src/TevmActions.ts:10](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L10) |
| <a id="from"></a> `from?` | `Address` | - | [packages/actions/src/TevmActions.ts:9](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L9) |
| <a id="gas"></a> `gas?` | `bigint` | - | [packages/actions/src/TevmActions.ts:12](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L12) |
| <a id="gasprice"></a> `gasPrice?` | `bigint` | - | [packages/actions/src/TevmActions.ts:13](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L13) |
| <a id="maxfeepergas"></a> `maxFeePerGas?` | `bigint` | - | [packages/actions/src/TevmActions.ts:14](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L14) |
| <a id="maxpriorityfeepergas"></a> `maxPriorityFeePerGas?` | `bigint` | - | [packages/actions/src/TevmActions.ts:15](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L15) |
| <a id="nonce"></a> `nonce?` | `bigint` | - | [packages/actions/src/TevmActions.ts:16](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L16) |
| <a id="stateoverride"></a> `stateOverride?` | `Record`\<`string`, `JsonValue`\> | - | [packages/actions/src/TevmActions.ts:20](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L20) |
| <a id="to"></a> `to?` | `Address` | - | [packages/actions/src/TevmActions.ts:8](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L8) |
| <a id="value"></a> `value?` | `bigint` | - | [packages/actions/src/TevmActions.ts:11](https://github.com/evmts/tevm/blob/main/packages/actions/src/TevmActions.ts#L11) |
