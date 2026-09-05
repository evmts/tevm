[**@tevm/node**](../README.md)

***

[@tevm/node](../globals.md) / ZevmEngineOptions

# Type Alias: ZevmEngineOptions

> **ZevmEngineOptions** = `object`

Defined in: packages/node/src/ZevmEngine.ts:10

Native engine configuration. Each engine owns independent state.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="chainid"></a> `chainId?` | `number` | Unsigned safe integer chain ID. Defaults to 31337. | packages/node/src/ZevmEngine.ts:12 |
| <a id="fork"></a> `fork?` | `object` | Fork upstream state into a local chain at height zero. Pin blockNumber for stable reads. | packages/node/src/ZevmEngine.ts:16 |
| `fork.blockNumber?` | `number` | - | packages/node/src/ZevmEngine.ts:16 |
| `fork.url` | `string` | - | packages/node/src/ZevmEngine.ts:16 |
| <a id="mining"></a> `mining?` | `object` | Automine defaults to true. Interval is whole seconds; zero disables the timer. | packages/node/src/ZevmEngine.ts:14 |
| `mining.auto?` | `boolean` | - | packages/node/src/ZevmEngine.ts:14 |
| `mining.interval?` | `number` | - | packages/node/src/ZevmEngine.ts:14 |
