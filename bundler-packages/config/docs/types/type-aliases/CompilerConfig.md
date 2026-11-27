[**@tevm/config**](../../README.md)

***

[@tevm/config](../../modules.md) / [types](../README.md) / CompilerConfig

# Type Alias: CompilerConfig

> **CompilerConfig** = `object`

Defined in: [bundler-packages/config/src/types.ts:11](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L11)

Configuration of the solidity compiler
When resolved with defaults it is a [ResolvedCompilerConfig](ResolvedCompilerConfig.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="cachedir"></a> `cacheDir?` | `string` | Location of the tevm cache folder | [bundler-packages/config/src/types.ts:38](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L38) |
| <a id="debug"></a> `debug?` | `boolean` | If debug is true tevm will write the .d.ts files in the ts server and publish extra debug info to a debug file | [bundler-packages/config/src/types.ts:34](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L34) |
| <a id="foundryproject"></a> `foundryProject?` | `boolean` \| `string` | If set to true it will resolve forge remappings and libs Set to "path/to/forge/executable" to use a custom forge executable | [bundler-packages/config/src/types.ts:21](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L21) |
| <a id="jsonasconst"></a> `jsonAsConst?` | `string` \| readonly `string`[] | A glob pattern or array of glob patterns indicating which ABIs should be resolved as const. This allows for more precise typing of ABIs in TypeScript. | [bundler-packages/config/src/types.ts:16](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L16) |
| <a id="libs"></a> `libs?` | readonly `string`[] | Sets directories to search for solidity imports in Read autoamtically for forge projects if forge: true | [bundler-packages/config/src/types.ts:26](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L26) |
| <a id="remappings"></a> `remappings?` | `ReadonlyRecord`\<`string`, `string`\> | Remap the location of contracts | [bundler-packages/config/src/types.ts:30](https://github.com/evmts/tevm/blob/main/bundler-packages/config/src/types.ts#L30) |
