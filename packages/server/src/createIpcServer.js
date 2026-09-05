import { createServer } from 'node:net'
import { StringDecoder } from 'node:string_decoder'
import { createRpcConnection } from './internal/createRpcConnection.js'
import { extractJsonRpcFrames } from './internal/extractJsonRpcFrames.js'

/** Create an IPC server supporting native RPC and connection-scoped subscriptions.
 * @param {import('./Client.js').Client} client
 * @param {import('node:net').ServerOpts} [options]
 * @param {{maxMessageSize?: number}} [limits]
 * @returns {import('node:net').Server}
 */
export function createIpcServer(client, options = {}, limits = {}) {
	return createServer(options, (socket) => {
		socket.on('error', () => socket.destroy())
		const decoder = new StringDecoder('utf8')
		let buffer = ''
		let queue = Promise.resolve()
		const connection = createRpcConnection(client.transport.tevm, (json) => {
			if (!socket.destroyed) socket.write(`${json}\n`)
		})
		socket.on('data', (data) => {
			buffer += decoder.write(data)
			if (Buffer.byteLength(buffer) > (limits.maxMessageSize ?? 1024 * 1024)) return void socket.destroy()
			const [frames, remaining] = extractJsonRpcFrames(buffer)
			buffer = remaining
			for (const frame of frames)
				queue = queue
					.then(() => connection.rpc(frame))
					.catch(() => {
						socket.destroy()
					})
		})
		socket.on('close', () => {
			void queue.finally(() => connection.close())
		})
	})
}
