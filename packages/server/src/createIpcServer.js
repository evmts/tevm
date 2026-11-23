import { createServer } from 'node:net'
import { StringDecoder } from 'node:string_decoder'
import { createRpcConnection } from './internal/createRpcConnection.js'
import { extractJsonRpcFrames } from './internal/extractJsonRpcFrames.js'

/** Create an IPC server supporting native RPC and connection-scoped subscriptions.
 * @param {import('./Client.js').Client} client
 * @param {import('node:net').ServerOpts} [options]
 * @param {{maxMessageSize?: number; maxSubscriptions?: number}} [limits] `maxSubscriptions` caps live
 * `eth_subscribe` subscriptions per connection (default 256).
 * @returns {import('node:net').Server}
 */
export function createIpcServer(client, options = {}, limits = {}) {
	return createServer(options, (socket) => {
		socket.on('error', () => socket.destroy())
		const decoder = new StringDecoder('utf8')
		let buffer = ''
		let queue = Promise.resolve()
		const connection = createRpcConnection(
			client.transport.tevm,
			(json) => {
				if (!socket.destroyed) socket.write(`${json}\n`)
			},
			limits.maxSubscriptions === undefined ? {} : { maxSubscriptions: limits.maxSubscriptions },
		)
		socket.on('data', (data) => {
			buffer += decoder.write(data)
			const [frames, remaining] = extractJsonRpcFrames(buffer)
			const limit = limits.maxMessageSize ?? 1024 * 1024
			if (Buffer.byteLength(remaining) > limit || frames.some((frame) => Buffer.byteLength(frame) > limit))
				return void socket.destroy()
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
