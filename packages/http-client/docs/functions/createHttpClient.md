[**@tevm/http-client**](../README.md)

***

[@tevm/http-client](../globals.md) / createHttpClient

# Function: createHttpClient()

> **createHttpClient**(`options`): `Client`\<`HttpTransport`\<`undefined`, `false`\>, `undefined`, `undefined`, `PublicRpcSchema`, `object` & `PublicActions`\<`HttpTransport`\<`undefined`, `false`\>, `undefined`\>\>

Defined in: [packages/http-client/src/createHttpClient.js:7](https://github.com/evmts/tevm/blob/main/packages/http-client/src/createHttpClient.js#L7)

Create a remote client for a native TEVM HTTP server.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | \{ `name?`: `string`; `url`: `string`; \} | - |
| `options.name?` | `string` | - |
| `options.url` | `string` | - |

## Returns

`Client`\<`HttpTransport`\<`undefined`, `false`\>, `undefined`, `undefined`, `PublicRpcSchema`, `object` & `PublicActions`\<`HttpTransport`\<`undefined`, `false`\>, `undefined`\>\>
