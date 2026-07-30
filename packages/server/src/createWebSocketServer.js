import { tevmSend } from '@tevm/decorators'
import { bytesToHex, numberToHex } from '@tevm/utils'
import { WebSocket, WebSocketServer } from 'ws'

/**
 * Adds a JSON-RPC WebSocket endpoint to an existing Node.js HTTP server.
 *
 * Subscriptions are scoped to their WebSocket connection. Closing a connection
 * removes every node listener and filter created by that connection.
 *
 * @param {import('./Client.js').Client} client - Tevm client that handles JSON-RPC requests.
 * @param {import('node:http').Server} server - HTTP server that should also accept WebSocket connections.
 * @param {{ maxPayload?: number; path?: string }} [options] - WebSocket server options.
 * @returns {WebSocketServer} The attached WebSocket server.
 * @throws {TypeError} If the supplied server is not a Node.js HTTP server.
 * @example
 * ```typescript
 * import { createServer } from 'node:http'
 * import { createMemoryClient } from 'tevm'
 * import { createHttpHandler, createWebSocketServer } from 'tevm/server'
 * import { createPublicClient, webSocket } from 'viem'
 *
 * const tevm = createMemoryClient()
 * const server = createServer(createHttpHandler(tevm))
 * createWebSocketServer(tevm, server)
 * await new Promise((resolve) => server.listen(8545, resolve))
 *
 * const client = createPublicClient({
 *   transport: webSocket('ws://127.0.0.1:8545'),
 * })
 * const chainId = await client.getChainId()
 * console.log(chainId)
 *
 * await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
 * ```
 */
export const createWebSocketServer = (client, server, options = {}) => {
	const node = client.transport.tevm
	const rpc = node.extend(tevmSend())
	const webSocketServer = new WebSocketServer({
		server,
		maxPayload: options.maxPayload ?? 1024 * 1024,
		...(options.path === undefined ? {} : { path: options.path }),
	})

	webSocketServer.on('connection', (socket) => {
		/** @type {Map<string, { remove: () => void }>} */
		const subscriptions = new Map()
		let closed = false

		/** @param {unknown} message */
		const send = (message) => {
			if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
		}

		/**
		 * @param {string} subscription
		 * @param {unknown} result
		 */
		const notify = (subscription, result) => {
			send({
				jsonrpc: '2.0',
				method: 'eth_subscription',
				params: { subscription, result },
			})
		}

		/**
		 * @param {unknown} addressFilter
		 * @param {string} address
		 */
		const matchesAddress = (addressFilter, address) => {
			if (addressFilter === undefined) return true
			const addresses = Array.isArray(addressFilter) ? addressFilter : [addressFilter]
			return addresses.some(
				(candidate) => typeof candidate === 'string' && candidate.toLowerCase() === address.toLowerCase(),
			)
		}

		/**
		 * @param {unknown} topicsFilter
		 * @param {Array<string>} topics
		 */
		const matchesTopics = (topicsFilter, topics) => {
			if (!Array.isArray(topicsFilter)) return true
			return topicsFilter.every((filter, index) => {
				if (filter === null || filter === undefined) return true
				const candidates = Array.isArray(filter) ? filter : [filter]
				return candidates.some(
					(candidate) =>
						typeof candidate === 'string' &&
						typeof topics[index] === 'string' &&
						candidate.toLowerCase() === topics[index]?.toLowerCase(),
				)
			})
		}

		/**
		 * `eth_subscribe` reuses the filter infrastructure, so the node buffers every
		 * block/log/tx into the subscription's filter. Nothing ever drains those buffers
		 * for a WebSocket subscription (the client is pushed notifications instead of
		 * polling `eth_getFilterChanges`), so they would grow without bound for the life
		 * of the connection. Drain them as we deliver each notification.
		 * @param {string} subscription
		 */
		const drainFilter = (subscription) => {
			const filter = node.getFilters().get(/** @type {import('@tevm/utils').Hex} */ (subscription))
			if (filter === undefined) return
			filter.blocks.length = 0
			filter.logs.length = 0
			filter.tx.length = 0
		}

		/**
		 * @param {string} subscription
		 * @param {unknown} subscriptionType
		 * @param {unknown} filter
		 */
		const bindSubscription = (subscription, subscriptionType, filter) => {
			switch (subscriptionType) {
				case 'newHeads': {
					/** @param {import('@tevm/block').Block} block */
					const listener = async (block) => {
						drainFilter(subscription)
						const response = await rpc.send({
							jsonrpc: '2.0',
							id: 0,
							method: 'eth_getBlockByHash',
							params: [bytesToHex(block.hash()), false],
						})
						if (response.result !== undefined) notify(subscription, response.result)
					}
					node.on('newBlock', listener)
					subscriptions.set(subscription, { remove: () => node.removeListener('newBlock', listener) })
					return
				}
				case 'logs': {
					const criteria =
						typeof filter === 'object' && filter !== null
							? /** @type {{ address?: unknown; topics?: unknown }} */ (filter)
							: {}
					/**
					 * @param {import('@tevm/utils').EthjsLog} rawLog
					 * @param {{ blockHash?: import('@tevm/utils').Hex; blockNumber?: bigint; transactionHash?: import('@tevm/utils').Hex; transactionIndex?: bigint; logIndex?: bigint }} [metadata]
					 */
					const listener = (rawLog, metadata = {}) => {
						drainFilter(subscription)
						const [addressBytes, topicBytes, dataBytes] = rawLog
						const address = bytesToHex(addressBytes)
						const topics = topicBytes.map((topic) => bytesToHex(topic))
						if (!matchesAddress(criteria.address, address) || !matchesTopics(criteria.topics, topics)) return
						notify(subscription, {
							address,
							topics,
							data: bytesToHex(dataBytes),
							blockNumber: numberToHex(metadata.blockNumber ?? 0n),
							transactionHash: metadata.transactionHash ?? '0x',
							transactionIndex: numberToHex(metadata.transactionIndex ?? 0n),
							blockHash: metadata.blockHash ?? '0x',
							logIndex: numberToHex(metadata.logIndex ?? 0n),
							removed: false,
						})
					}
					node.on('newLog', listener)
					subscriptions.set(subscription, { remove: () => node.removeListener('newLog', listener) })
					return
				}
				case 'newPendingTransactions': {
					/** @param {{ hash: () => Uint8Array }} transaction */
					const listener = (transaction) => {
						drainFilter(subscription)
						notify(subscription, bytesToHex(transaction.hash()))
					}
					node.on('newPendingTransaction', listener)
					subscriptions.set(subscription, {
						remove: () => node.removeListener('newPendingTransaction', listener),
					})
					return
				}
				case 'syncing': {
					let syncing = node.status === 'SYNCING'
					const initialNotification = setTimeout(() => notify(subscription, syncing), 0)
					const interval = setInterval(() => {
						const nextSyncing = node.status === 'SYNCING'
						if (nextSyncing !== syncing) {
							syncing = nextSyncing
							notify(subscription, syncing)
						}
					}, 100)
					interval.unref()
					subscriptions.set(subscription, {
						remove: () => {
							clearTimeout(initialNotification)
							clearInterval(interval)
						},
					})
					return
				}
				default:
					return
			}
		}

		/** @param {string} subscription */
		const removeSubscription = (subscription) => {
			subscriptions.get(subscription)?.remove()
			subscriptions.delete(subscription)
		}

		/**
		 * @param {unknown} value
		 * @returns {value is { jsonrpc?: string; id?: string | number | null; method: string; params?: Array<unknown> }}
		 */
		const isRequest = (value) =>
			typeof value === 'object' && value !== null && 'method' in value && typeof value.method === 'string'

		/** @param {unknown} value */
		const handleRequest = async (value) => {
			if (!isRequest(value)) {
				return {
					jsonrpc: '2.0',
					id: null,
					error: { code: -32600, message: 'Invalid Request' },
				}
			}

			const request = { ...value, jsonrpc: '2.0' }
			if (request.method === 'eth_unsubscribe') {
				const subscription = request.params?.[0]
				if (typeof subscription !== 'string' || !subscriptions.has(subscription)) {
					return {
						jsonrpc: '2.0',
						...(request.id === undefined ? {} : { id: request.id }),
						result: false,
					}
				}
			}

			try {
				const response = await rpc.send(/** @type {any} */ (request))
				if (request.method === 'eth_subscribe' && typeof response.result === 'string') {
					bindSubscription(response.result, request.params?.[0], request.params?.[1])
				} else if (request.method === 'eth_unsubscribe' && response.result === true) {
					const subscription = request.params?.[0]
					if (typeof subscription === 'string') removeSubscription(subscription)
				}
				return response
			} catch (error) {
				return {
					jsonrpc: '2.0',
					...(request.id === undefined ? {} : { id: request.id }),
					error: {
						code:
							typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number'
								? error.code
								: -32603,
						message: error instanceof Error ? error.message : 'Internal error',
					},
				}
			}
		}

		/** @param {import('ws').RawData} data */
		const onMessage = async (data) => {
			let request
			try {
				request = JSON.parse(data.toString())
			} catch (_error) {
				send({
					jsonrpc: '2.0',
					id: null,
					error: { code: -32700, message: 'Parse error' },
				})
				return
			}

			if (Array.isArray(request)) {
				if (request.length === 0) {
					send({
						jsonrpc: '2.0',
						id: null,
						error: { code: -32600, message: 'Invalid Request' },
					})
					return
				}
				const responses = (await Promise.all(request.map(handleRequest))).filter(
					(response, index) => request[index]?.id !== undefined || response.error !== undefined,
				)
				if (responses.length > 0) send(responses)
				return
			}

			const response = await handleRequest(request)
			if (request?.id !== undefined || response.error !== undefined) send(response)
		}

		// A rejection here would be an unhandled rejection that can take the process down,
		// so a message that fails to serialize must never escape the handler.
		socket.on('message', (data) => {
			onMessage(data).catch(() => {
				send({
					jsonrpc: '2.0',
					id: null,
					error: { code: -32603, message: 'Internal error' },
				})
			})
		})

		const cleanup = () => {
			if (closed) return
			closed = true
			for (const subscription of subscriptions.keys()) {
				removeSubscription(subscription)
				void rpc.send(
					/** @type {any} */ ({
						jsonrpc: '2.0',
						id: 0,
						method: 'eth_unsubscribe',
						params: [subscription],
					}),
				)
			}
		}
		socket.once('close', cleanup)
		// `on`, not `once`: an unhandled 'error' event on a socket throws, so a second
		// error after the first must still find a listener. `cleanup` is idempotent.
		socket.on('error', cleanup)
	})

	const closeServer = server.close.bind(server)
	server.close = /** @type {typeof server.close} */ (
		(callback) => {
			for (const socket of webSocketServer.clients) socket.terminate()
			webSocketServer.close()
			return closeServer(callback)
		}
	)

	return webSocketServer
}
