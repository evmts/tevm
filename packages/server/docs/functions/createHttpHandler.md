[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createHttpHandler

# Function: createHttpHandler()

> **createHttpHandler**(`client`, `options?`): `RequestListener`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>

Defined in: [createHttpHandler.js:10](https://github.com/evmts/tevm/blob/main/packages/server/src/createHttpHandler.js#L10)

Expose the native JSON-RPC dispatcher over HTTP. Parsing, batches, error
encoding and notification semantics are owned by ZEVM.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | - |
| `options?` | \{ `cors?`: `boolean`; `maxBatchSize?`: `number`; `maxBodySize?`: `number`; `requestTimeout?`: `number`; \} | - |
| `options.cors?` | `boolean` | - |
| `options.maxBatchSize?` | `number` | - |
| `options.maxBodySize?` | `number` | - |
| `options.requestTimeout?` | `number` | - |

## Returns

`RequestListener`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>
