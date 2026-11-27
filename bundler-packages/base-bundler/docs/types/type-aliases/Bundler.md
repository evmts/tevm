[**@tevm/base-bundler**](../../README.md)

***

[@tevm/base-bundler](../../modules.md) / [types](../README.md) / Bundler

# Type Alias: Bundler

> **Bundler** = (`config`, `logger`, `fao`, `solc`, `cache`, `contractPackage?`) => `object`

Defined in: [types.ts:48](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L48)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `ResolvedCompilerConfig` |
| `logger` | [`Logger`](Logger.md) |
| `fao` | [`FileAccessObject`](FileAccessObject.md) |
| `solc` | `any` |
| `cache` | `Cache` |
| `contractPackage?` | `"@tevm/contract"` \| `"tevm/contract"` |

## Returns

### config

> **config**: `ResolvedCompilerConfig`

The configuration of the plugin.

### exclude?

> `optional` **exclude?**: `string`[]

### include?

> `optional` **include?**: `string`[]

### name

> **name**: `string`

The name of the plugin.

### resolveCjsModule

> **resolveCjsModule**: [`AsyncBundlerResult`](AsyncBundlerResult.md)

Resolves cjs representation of the solidity module

### resolveCjsModuleSync

> **resolveCjsModuleSync**: [`SyncBundlerResult`](SyncBundlerResult.md)

Resolves cjs representation of the solidity module

### resolveDts

> **resolveDts**: [`AsyncBundlerResult`](AsyncBundlerResult.md)

Resolves .d.ts representation of the solidity module

### resolveDtsSync

> **resolveDtsSync**: [`SyncBundlerResult`](SyncBundlerResult.md)

Resolves .d.ts representation of the solidity module

### resolveEsmModule

> **resolveEsmModule**: [`AsyncBundlerResult`](AsyncBundlerResult.md)

Resolves the esm representation of the solidity module

### resolveEsmModuleSync

> **resolveEsmModuleSync**: [`SyncBundlerResult`](SyncBundlerResult.md)

Resolves the esm representation of the solidity module

### resolveTsModule

> **resolveTsModule**: [`AsyncBundlerResult`](AsyncBundlerResult.md)

Resolves typescript representation of the solidity module

### resolveTsModuleSync

> **resolveTsModuleSync**: [`SyncBundlerResult`](SyncBundlerResult.md)

Resolves typescript representation of the solidity module
