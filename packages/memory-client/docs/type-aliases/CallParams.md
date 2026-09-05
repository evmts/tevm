[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / CallParams

# Type Alias: CallParams

> **CallParams** = `object`

Defined in: packages/actions/dist/index.d.ts:11

Native call parameters. State overrides use the standard eth_call wire shape.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="addtoblockchain"></a> `addToBlockchain?` | `boolean` | packages/actions/dist/index.d.ts:24 |
| <a id="addtomempool"></a> `addToMempool?` | `boolean` | packages/actions/dist/index.d.ts:23 |
| <a id="blocktag"></a> `blockTag?` | `string` | packages/actions/dist/index.d.ts:21 |
| <a id="data"></a> `data?` | `Hex` | packages/actions/dist/index.d.ts:14 |
| <a id="from"></a> `from?` | `Address` | packages/actions/dist/index.d.ts:13 |
| <a id="gas"></a> `gas?` | `bigint` | packages/actions/dist/index.d.ts:16 |
| <a id="gasprice"></a> `gasPrice?` | `bigint` | packages/actions/dist/index.d.ts:17 |
| <a id="maxfeepergas"></a> `maxFeePerGas?` | `bigint` | packages/actions/dist/index.d.ts:18 |
| <a id="maxpriorityfeepergas"></a> `maxPriorityFeePerGas?` | `bigint` | packages/actions/dist/index.d.ts:19 |
| <a id="nonce"></a> `nonce?` | `bigint` | packages/actions/dist/index.d.ts:20 |
| <a id="stateoverride"></a> `stateOverride?` | `Record`\<`string`, `JsonValue`\> | packages/actions/dist/index.d.ts:22 |
| <a id="to"></a> `to?` | `Address` | packages/actions/dist/index.d.ts:12 |
| <a id="value"></a> `value?` | `bigint` | packages/actions/dist/index.d.ts:15 |
