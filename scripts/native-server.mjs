import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'

const client = createMemoryClient()
await client.tevmReady()
const server = createServer(client, {}, { cors: true })
server.listen(8545, '127.0.0.1', () => console.log('Native TEVM RPC: http://127.0.0.1:8545'))
const close = () =>
	server.close(() => {
		void client.tevmClose()
	})
process.once('SIGINT', close)
process.once('SIGTERM', close)
