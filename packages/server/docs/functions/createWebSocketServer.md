[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createWebSocketServer

# Function: createWebSocketServer()

> **createWebSocketServer**(`client`, `server`, `options?`): `WebSocketServer`

Defined in: [packages/server/src/createWebSocketServer.js:37](https://github.com/evmts/tevm/blob/main/packages/server/src/createWebSocketServer.js#L37)

Adds a JSON-RPC WebSocket endpoint to an existing Node.js HTTP server.

Subscriptions are scoped to their WebSocket connection. Closing a connection
removes every node listener and filter created by that connection.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | Tevm client that handles JSON-RPC requests. |
| `server` | `Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\> | HTTP server that should also accept WebSocket connections. |
| `options?` | \{ `maxPayload?`: `number`; `path?`: `string`; \} | WebSocket server options. |
| `options.maxPayload?` | `number` | - |
| `options.path?` | `string` | - |

## Returns

`WebSocketServer`

The attached WebSocket server.

## Throws

If the supplied server is not a Node.js HTTP server.

## Example

```typescript
import { createServer } from 'node:http'
import { createMemoryClient } from 'tevm'
import { createHttpHandler, createWebSocketServer } from 'tevm/server'
import { createPublicClient, webSocket } from 'viem'

const tevm = createMemoryClient()
const server = createServer(createHttpHandler(tevm))
createWebSocketServer(tevm, server)
await new Promise((resolve) => server.listen(8545, resolve))

const client = createPublicClient({
  transport: webSocket('ws://127.0.0.1:8545'),
})
const chainId = await client.getChainId()
console.log(chainId)

await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
```
