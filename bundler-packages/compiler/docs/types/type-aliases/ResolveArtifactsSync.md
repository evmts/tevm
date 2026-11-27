[**@tevm/compiler**](../../README.md)

***

[@tevm/compiler](../../modules.md) / [types](../README.md) / ResolveArtifactsSync

# Type Alias: ResolveArtifactsSync

> **ResolveArtifactsSync** = (`solFile`, `basedir`, `logger`, `config`, `includeAst`, `includeBytecode`, `fao`, `solc`) => [`ResolvedArtifacts`](ResolvedArtifacts.md)

Defined in: [compiler/src/types.ts:25](https://github.com/evmts/tevm/blob/main/bundler-packages/compiler/src/types.ts#L25)

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

[`ResolvedArtifacts`](ResolvedArtifacts.md)
