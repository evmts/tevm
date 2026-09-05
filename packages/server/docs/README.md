**@tevm/server**

***

# @tevm/server

HTTP, WebSocket and IPC transports for native ZEVM. HTTP preserves native JSON-RPC results, errors, batches and notifications. WebSocket and IPC provide connection-scoped block, log, pending-transaction and syncing subscriptions using native filters.

```js
import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
const client = createMemoryClient()
await client.tevmReady()
const server = createServer(client)
server.listen(8545, '127.0.0.1')
process.once('SIGINT', () => server.close(() => { void client.tevmClose() }))
```

`createHttpHandler`, `createWebSocketServer`, `createIpcServer`, `createExpressMiddleware`, and `createNextApiHandler` are also exported. Pass `{ cors: true }` as the third `createServer` argument for browser development. HTTP defaults to a 1 MiB body limit and 30-second request timeout; notification responses use HTTP 204.
