[**@tevm/config**](../../README.md)

***

[@tevm/config](../../modules.md) / [types](../README.md) / DefineConfig

# Type Alias: DefineConfig

> **DefineConfig** = (`configFactory`) => `object`

Defined in: [bundler-packages/config/src/types.ts:92](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L92)

Creates an Tevm config
Takes a user provided configFactory

## Parameters

| Parameter | Type |
| ------ | ------ |
| `configFactory` | [`ConfigFactory`](ConfigFactory.md) |

## Returns

`object`

### configFn

> **configFn**: (`configFilePath`) => `Effect`\<[`ResolvedCompilerConfig`](ResolvedCompilerConfig.md), [`DefineConfigError`](../../defineConfig/classes/DefineConfigError.md), `never`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `configFilePath` | `string` |

#### Returns

`Effect`\<[`ResolvedCompilerConfig`](ResolvedCompilerConfig.md), [`DefineConfigError`](../../defineConfig/classes/DefineConfigError.md), `never`\>

## Example

```ts
import { defineConfig } from 'tevm/config'
export default defineConfig({
	foundryProject: true,
		libs: ['libs/contracts'],
	})
```
