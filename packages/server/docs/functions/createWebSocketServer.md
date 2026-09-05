[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createWebSocketServer

# Function: createWebSocketServer()

> **createWebSocketServer**(`client`, `server`, `options?`): `WebSocketServer`

Defined in: [createWebSocketServer.js:10](https://github.com/evmts/tevm/blob/main/packages/server/src/createWebSocketServer.js#L10)

Attach native JSON-RPC and subscriptions to an HTTP server.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | - |
| `server` | `Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\> | - |
| `options?` | \{ `maxPayload?`: `number`; `path?`: `string`; \} | - |
| `options.maxPayload?` | `number` | - |
| `options.path?` | `string` | - |

## Returns

`WebSocketServer`
