import { createServer } from 'node:net'
import { StringDecoder } from 'node:string_decoder'
import { createRpcConnection } from './internal/createRpcConnection.js'
import { createJsonRpcFrameExtractor } from './internal/extractJsonRpcFrames.js'
import { getMaxSubscriptions } from './internal/getMaxSubscriptions.js'

/** Create an IPC server supporting native RPC and connection-scoped subscriptions.
 * @param {import('./Client.js').Client} client
 * @param {import('node:net').ServerOpts} [options]
 * @param {{maxMessageSize?: number; maxSubscriptions?: number}} [limits] `maxSubscriptions` caps live
 * `eth_subscribe` subscriptions per connection (default 256, or `Infinity` for no cap).
 * @throws {RangeError} If the subscription cap is neither a non-negative integer nor `Infinity`.
 * @returns {import('node:net').Server}
 */
export function createIpcServer(client, options = {}, limits = {}) {
	const maxSubscriptions = getMaxSubscriptions(limits.maxSubscriptions)
	const maxMessageSize = limits.maxMessageSize ?? 1024 * 1024
	return createServer(options, (socket) => {
		socket.on('error', () => socket.destroy())
		const decoder = new StringDecoder('utf8')
		const extractor = createJsonRpcFrameExtractor()
		let queue = Promise.resolve()
		const connection = createRpcConnection(
			client.transport.tevm,
			(json) => {
				if (!socket.destroyed) socket.write(`${json}\n`)
			},
			{ maxSubscriptions },
		)
		socket.on('data', (data) => {
			// The limit applies to each frame and to the unframed remainder, not to a
			// chunk that carries many complete small frames.
			const frames = extractor.push(decoder.write(data))
			if (
				Buffer.byteLength(extractor.remaining(), 'utf8') > maxMessageSize ||
				frames.some((frame) => Buffer.byteLength(frame, 'utf8') > maxMessageSize)
			)
				return void socket.destroy()
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
