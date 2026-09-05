import { WebSocket, WebSocketServer } from 'ws'
import { createRpcConnection } from './internal/createRpcConnection.js'

/** Attach native JSON-RPC and subscriptions to an HTTP server.
 * @param {import('./Client.js').Client} client
 * @param {import('node:http').Server} server
 * @param {{maxPayload?: number; path?: string}} [options]
 * @returns {WebSocketServer}
 */
export function createWebSocketServer(client, server, options = {}) {
	const wss = new WebSocketServer({
		server,
		maxPayload: options.maxPayload ?? 1024 * 1024,
		...(options.path === undefined ? {} : { path: options.path }),
	})
	wss.on('connection', (socket) => {
		// ws closes malformed/oversized frames itself; consume its error event
		// so a peer's protocol violation cannot terminate the host process.
		socket.on('error', () => {})
		const connection = createRpcConnection(client.transport.tevm, (json) => {
			if (socket.readyState === WebSocket.OPEN) socket.send(json)
		})
		let queue = Promise.resolve()
		socket.on('message', (data) => {
			queue = queue
				.then(() => connection.rpc(data.toString()))
				.catch(() => {
					socket.close(1011, 'Native engine unavailable')
				})
		})
		socket.on('close', () => {
			void queue.finally(() => connection.close())
		})
	})
	server.on('close', () => {
		for (const socket of wss.clients) socket.terminate()
		wss.close()
	})
	return wss
}
