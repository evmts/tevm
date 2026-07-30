import { createServer as httpCreateServer } from 'node:http'
import { createHttpHandler } from './createHttpHandler.js'
import { createWebSocketServer } from './createWebSocketServer.js'

/**
 * Creates a lightweight HTTP and WebSocket JSON-RPC server.
 *
 * The WebSocket endpoint shares the HTTP server's port and supports
 * `eth_subscribe` notifications.
 *
 * @param {import('@tevm/memory-client').MemoryClient} client - Tevm client that handles JSON-RPC requests.
 * @param {import('node:http').ServerOptions} [serverOptions] - Node.js HTTP server options.
 * @param {{ compatibility?: boolean; maxBodySize?: number; maxHeaderSize?: number; maxBatchSize?: number; requestTimeout?: number; cors?: boolean }} [handlerOptions] - HTTP and WebSocket transport options.
 * @returns {import('node:http').Server} The HTTP server with WebSocket support attached.
 * @throws {TypeError} If Node.js rejects the supplied server options.
 * @example
 * ```typescript
 * import { createMemoryClient } from 'tevm'
 * import { createServer } from 'tevm/server'
 * import { createPublicClient, webSocket } from 'viem'
 *
 * const tevm = createMemoryClient()
 * const server = createServer(tevm)
 * await new Promise((resolve) => server.listen(8545, resolve))
 *
 * const client = createPublicClient({
 *   transport: webSocket('ws://127.0.0.1:8545'),
 * })
 * console.log(await client.getBlockNumber())
 *
 * await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
 * ```
 */
export const createServer = (client, serverOptions = {}, handlerOptions = {}) => {
	const server = httpCreateServer(serverOptions, createHttpHandler(client, handlerOptions))
	createWebSocketServer(client, server, {
		...(handlerOptions.maxBodySize === undefined ? {} : { maxPayload: handlerOptions.maxBodySize }),
	})
	return server
}
