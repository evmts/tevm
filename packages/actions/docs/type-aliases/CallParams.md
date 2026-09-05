[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / CallParams

# Type Alias: CallParams

> **CallParams** = `object`

Defined in: TevmActions.ts:7

Native call parameters. State overrides use the standard eth_call wire shape.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="addtoblockchain"></a> `addToBlockchain?` | `boolean` | TevmActions.ts:20 |
| <a id="addtomempool"></a> `addToMempool?` | `boolean` | TevmActions.ts:19 |
| <a id="blocktag"></a> `blockTag?` | `string` | TevmActions.ts:17 |
| <a id="data"></a> `data?` | `Hex` | TevmActions.ts:10 |
| <a id="from"></a> `from?` | `Address` | TevmActions.ts:9 |
| <a id="gas"></a> `gas?` | `bigint` | TevmActions.ts:12 |
| <a id="gasprice"></a> `gasPrice?` | `bigint` | TevmActions.ts:13 |
| <a id="maxfeepergas"></a> `maxFeePerGas?` | `bigint` | TevmActions.ts:14 |
| <a id="maxpriorityfeepergas"></a> `maxPriorityFeePerGas?` | `bigint` | TevmActions.ts:15 |
| <a id="nonce"></a> `nonce?` | `bigint` | TevmActions.ts:16 |
| <a id="stateoverride"></a> `stateOverride?` | `Record`\<`string`, `JsonValue`\> | TevmActions.ts:18 |
| <a id="to"></a> `to?` | `Address` | TevmActions.ts:8 |
| <a id="value"></a> `value?` | `bigint` | TevmActions.ts:11 |
