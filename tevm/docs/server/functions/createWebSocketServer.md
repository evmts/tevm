[**tevm**](../../README.md)

***

[tevm](../../modules.md) / [server](../README.md) / createWebSocketServer

# Function: createWebSocketServer()

> **createWebSocketServer**(`client`, `server`, `options?`): `WebSocketServer`

## Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) |
| `server` | `Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\> |
| `options?` | \{ `maxPayload?`: `number`; `path?`: `string`; \} |
| `options.maxPayload?` | `number` |
| `options.path?` | `string` |

## Returns

`WebSocketServer`
