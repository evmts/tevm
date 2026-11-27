[**@tevm/compiler**](../../README.md)

***

[@tevm/compiler](../../modules.md) / [types](../README.md) / CompiledContracts

# Type Alias: CompiledContracts\<TIncludeAsts\>

> **CompiledContracts**\<`TIncludeAsts`\> = `object`

Defined in: [compiler/src/types.ts:52](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L52)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TIncludeAsts` *extends* `boolean` | `boolean` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="artifacts"></a> `artifacts` | `NonNullable`\<[`SolcOutput`](SolcOutput.md)\[`"contracts"`\]\>\[`string`\] \| `undefined` | [compiler/src/types.ts:53](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L53) |
| <a id="asts"></a> `asts` | `TIncludeAsts` *extends* `true` ? `Record`\<`string`, `Node`\> : `undefined` | [compiler/src/types.ts:55](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L55) |
| <a id="modules"></a> `modules` | `Record`\<`string`, [`ModuleInfo`](ModuleInfo.md)\> | [compiler/src/types.ts:54](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L54) |
| <a id="solcinput"></a> `solcInput?` | [`SolcInputDescription`](SolcInputDescription.md) | [compiler/src/types.ts:56](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L56) |
| <a id="solcoutput"></a> `solcOutput?` | [`SolcOutput`](SolcOutput.md) | [compiler/src/types.ts:57](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L57) |
