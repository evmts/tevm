[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createIpcServer

# Function: createIpcServer()

> **createIpcServer**(`client`, `serverOptions?`, `handlerOptions?`): `Server`

Defined in: [packages/server/src/createIpcServer.js:28](https://github.com/evmts/tevm/blob/main/packages/server/src/createIpcServer.js#L28)

Creates a Unix domain socket JSON-RPC server backed by a Tevm client.

The server accepts concatenated or newline-delimited JSON-RPC messages and
streams `eth_subscription` notifications over the same connection.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | Tevm client that handles JSON-RPC requests. |
| `serverOptions?` | `ServerOpts` | Options passed to `node:net.createServer`. |
| `handlerOptions?` | \{ `maxBatchSize?`: `number`; `maxMessageSize?`: `number`; \} | IPC framing limits. |
| `handlerOptions.maxBatchSize?` | `number` | - |
| `handlerOptions.maxMessageSize?` | `number` | - |

## Returns

`Server`

A Node.js server that can listen on a Unix domain socket path.

## Throws

Startup and connection errors are emitted by the returned server.

## Example

```typescript
import { createMemoryClient } from 'tevm'
import { createIpcServer } from 'tevm/server'

const client = createMemoryClient()
const server = createIpcServer(client)

server.listen('/tmp/tevm.ipc', () => {
  console.log('Tevm IPC server listening at /tmp/tevm.ipc')
})
```
