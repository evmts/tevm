# @tevm/server

HTTP, WebSocket and IPC transports for native ZEVM. HTTP preserves native JSON-RPC results, errors, batches and notifications. WebSocket and IPC provide connection-scoped block, log, pending-transaction and syncing subscriptions using native filters.

```js
import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
const client = createMemoryClient()
await client.tevmReady()
const server = createServer(client)
server.listen(8545, '127.0.0.1')
process.once('SIGINT', () =>
	server.close(() => {
		void client.tevmClose()
	}),
)
```

`createHttpHandler`, `createWebSocketServer`, `createIpcServer`, `createExpressMiddleware`, and `createNextApiHandler` are also exported. Pass `{ cors: true }` as the third `createServer` argument for browser development. HTTP defaults to a 1 MiB body limit and 30-second request timeout; notification responses use HTTP 204. The body limit counts incoming bytes before UTF-8 decoding and accepts a body exactly at the limit.

The third argument to `createServer` also accepts the WebSocket upgrade `path` and byte limit `maxPayload`. Closing the server disconnects active WebSocket clients. `maxSubscriptions` caps live `eth_subscribe` subscriptions per WebSocket or IPC connection (default 256; `createIpcServer` takes it in its third argument). A subscription over the cap fails with JSON-RPC error `-32005`. A subscription whose backend filter no longer exists is dropped. The Express and Next.js adapters take the same HTTP handler options as their second argument. HTTP body failures return 413 for oversized input, 400 for invalid pre-parsed input, and 500 for stream read failures, including a request stream that another body reader already consumed without setting `req.body`.
