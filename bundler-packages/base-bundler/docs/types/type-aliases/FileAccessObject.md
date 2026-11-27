[**@tevm/base-bundler**](../../README.md)

***

[@tevm/base-bundler](../../modules.md) / [types](../README.md) / FileAccessObject

# Type Alias: FileAccessObject

> **FileAccessObject** = `object`

Defined in: [types.ts:21](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L21)

Generalized interface for accessing file system
Allows this package to be used in browser environments or otherwise pluggable

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="exists"></a> `exists` | (`path`) => `Promise`\<`boolean`\> | [types.ts:26](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L26) |
| <a id="existssync"></a> `existsSync` | (`path`) => `boolean` | [types.ts:27](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L27) |
| <a id="mkdir"></a> `mkdir` | *typeof* `mkdir` | [types.ts:31](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L31) |
| <a id="mkdirsync"></a> `mkdirSync` | *typeof* `mkdirSync` | [types.ts:30](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L30) |
| <a id="readfile"></a> `readFile` | (`path`, `encoding`) => `Promise`\<`string`\> | [types.ts:24](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L24) |
| <a id="readfilesync"></a> `readFileSync` | (`path`, `encoding`) => `string` | [types.ts:25](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L25) |
| <a id="stat"></a> `stat` | *typeof* `stat` | [types.ts:29](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L29) |
| <a id="statsync"></a> `statSync` | *typeof* `statSync` | [types.ts:28](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L28) |
| <a id="writefile"></a> `writeFile` | *typeof* `writeFile` | [types.ts:23](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L23) |
| <a id="writefilesync"></a> `writeFileSync` | (`path`, `data`) => `void` | [types.ts:22](https://github.com/evmts/tevm/blob/main/bundler-packages/base-bundler/src/types.ts#L22) |
