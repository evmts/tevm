import { createServer as createHttpServer } from 'node:http'
import { createHttpHandler } from './createHttpHandler.js'
import { createWebSocketServer } from './createWebSocketServer.js'

/** Create an HTTP/WebSocket server backed by the client's native engine.
 * @param {import('./Client.js').Client} client
 * @param {import('node:http').ServerOptions} [serverOptions]
 * @param {Parameters<typeof createHttpHandler>[1]} [handlerOptions]
 * @returns {import('node:http').Server}
 */
export function createServer(client, serverOptions = {}, handlerOptions = {}) {
	const server = createHttpServer(serverOptions, createHttpHandler(client, handlerOptions))
	createWebSocketServer(client, server)
	return server
}
