[**@tevm/base-bundler**](../../README.md)

***

[@tevm/base-bundler](../../modules.md) / [types](../README.md) / SolidityResolver

# Type Alias: SolidityResolver

> **SolidityResolver** = (`config`, `logger`) => `object`

Defined in: [types.ts:111](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L111)

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `ResolvedCompilerConfig` |
| `logger` | [`Logger`](Logger.md) |

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

> **resolveCjsModule**: (`module`, `basedir`) => `Promise`\<[`BundlerResult`](BundlerResult.md)\>

Resolves cjs representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

`Promise`\<[`BundlerResult`](BundlerResult.md)\>

### resolveCjsModuleSync

> **resolveCjsModuleSync**: (`module`, `basedir`) => [`BundlerResult`](BundlerResult.md)

Resolves cjs representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

[`BundlerResult`](BundlerResult.md)

### resolveDts

> **resolveDts**: (`module`, `basedir`) => `Promise`\<[`BundlerResult`](BundlerResult.md)\>

Resolves .d.ts representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

`Promise`\<[`BundlerResult`](BundlerResult.md)\>

### resolveDtsSync

> **resolveDtsSync**: (`module`, `basedir`) => [`BundlerResult`](BundlerResult.md)

Resolves .d.ts representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

[`BundlerResult`](BundlerResult.md)

### resolveEsmModule

> **resolveEsmModule**: (`module`, `basedir`) => `Promise`\<[`BundlerResult`](BundlerResult.md)\>

Resolves the esm representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

`Promise`\<[`BundlerResult`](BundlerResult.md)\>

### resolveEsmModuleSync

> **resolveEsmModuleSync**: (`module`, `basedir`) => [`BundlerResult`](BundlerResult.md)

Resolves the esm representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

[`BundlerResult`](BundlerResult.md)

### resolveTsModule

> **resolveTsModule**: (`module`, `basedir`) => `Promise`\<[`BundlerResult`](BundlerResult.md)\>

Resolves typescript representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

`Promise`\<[`BundlerResult`](BundlerResult.md)\>

### resolveTsModuleSync

> **resolveTsModuleSync**: (`module`, `basedir`) => [`BundlerResult`](BundlerResult.md)

Resolves typescript representation of the solidity module

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `module` | `string` |
| `basedir` | `string` |

#### Returns

[`BundlerResult`](BundlerResult.md)
