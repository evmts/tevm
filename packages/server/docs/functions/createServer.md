[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createServer

# Function: createServer()

> **createServer**(`client`, `serverOptions?`, `handlerOptions?`): `Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>

Defined in: [packages/server/src/createServer.js:11](https://github.com/evmts/tevm/blob/main/packages/server/src/createServer.js#L11)

Create an HTTP/WebSocket server backed by the client's native engine.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | - |
| `serverOptions?` | `ServerOptions`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\> | - |
| `handlerOptions?` | `object` & `object` | - |

## Returns

`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>
