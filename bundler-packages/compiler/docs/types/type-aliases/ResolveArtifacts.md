[**@tevm/compiler**](../../README.md)

***

[@tevm/compiler](../../modules.md) / [types](../README.md) / ResolveArtifacts

# Type Alias: ResolveArtifacts

> **ResolveArtifacts** = (`solFile`, `basedir`, `logger`, `config`, `includeAst`, `includeBytecode`, `fao`, `solc`) => `Promise`\<[`ResolvedArtifacts`](ResolvedArtifacts.md)\>

Defined in: [compiler/src/types.ts:14](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L14)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `solFile` | `string` |
| `basedir` | `string` |
| `logger` | [`Logger`](Logger.md) |
| `config` | `ResolvedCompilerConfig` |
| `includeAst` | `boolean` |
| `includeBytecode` | `boolean` |
| `fao` | [`FileAccessObject`](FileAccessObject.md) |
| `solc` | `any` |

## Returns

`Promise`\<[`ResolvedArtifacts`](ResolvedArtifacts.md)\>
