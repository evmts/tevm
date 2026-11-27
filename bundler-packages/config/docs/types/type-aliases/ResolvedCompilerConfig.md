[**@tevm/config**](../../README.md)

***

[@tevm/config](../../modules.md) / [types](../README.md) / ResolvedCompilerConfig

# Type Alias: ResolvedCompilerConfig

> **ResolvedCompilerConfig** = `object`

Defined in: [bundler-packages/config/src/types.ts:50](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L50)

A fully resolved compiler config with defaults filled in
See [CompilerConfig](CompilerConfig.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="cachedir"></a> `cacheDir` | `string` | Location of the tevm cache folder | [bundler-packages/config/src/types.ts:77](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L77) |
| <a id="debug"></a> `debug?` | `boolean` | If debug is true tevm will write the .d.ts files in the ts server and publish extra debug info to a debug file | [bundler-packages/config/src/types.ts:73](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L73) |
| <a id="foundryproject"></a> `foundryProject` | `boolean` \| `string` | If set to true it will resolve forge remappings and libs Set to "path/to/forge/executable" to use a custom forge executable | [bundler-packages/config/src/types.ts:60](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L60) |
| <a id="jsonasconst"></a> `jsonAsConst` | readonly `string`[] | A glob pattern or array of glob patterns indicating which ABIs should be resolved as const. This allows for more precise typing of ABIs in TypeScript. | [bundler-packages/config/src/types.ts:55](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L55) |
| <a id="libs"></a> `libs` | readonly `string`[] | Sets directories to search for solidity imports in Read autoamtically for forge projects if forge: true | [bundler-packages/config/src/types.ts:65](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L65) |
| <a id="remappings"></a> `remappings` | `ReadonlyRecord`\<`string`, `string`\> | Remap the location of contracts | [bundler-packages/config/src/types.ts:69](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L69) |
