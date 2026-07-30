import { StringDecoder } from 'node:string_decoder'
import { InternalError, InvalidRequestError } from '@tevm/errors'
import { InvalidJsonError } from '../errors/InvalidJsonError.js'
import { createIpcSubscription } from './createIpcSubscription.js'
import { extractJsonRpcFrames } from './extractJsonRpcFrames.js'
import { handleBulkRequest } from './handleBulkRequest.js'
import { parseRequest } from './parseRequest.js'

const DEFAULT_MAX_MESSAGE_SIZE = 1024 * 1024
const DEFAULT_MAX_BATCH_SIZE = 100

/**
 * Creates the connection listener used by a Node.js IPC server.
 *
 * @param {import('../Client.js').Client} client - Tevm client that handles JSON-RPC requests.
 * @param {{ maxMessageSize?: number; maxBatchSize?: number }} [options] - IPC framing limits.
 * @returns {(socket: import('node:net').Socket) => void} Node.js connection listener.
 * @throws {never}
 */
export const createIpcConnectionHandler = (client, options = {}) => {
	const { maxBatchSize = DEFAULT_MAX_BATCH_SIZE, maxMessageSize = DEFAULT_MAX_MESSAGE_SIZE } = options
	const tevm = client.transport.tevm

	return (socket) => {
		let buffer = ''
		let queue = Promise.resolve()
		const decoder = new StringDecoder('utf8')
		/** @type {Map<string, () => void>} */
		const subscriptions = new Map()

		/**
		 * @param {unknown} message
		 * @returns {void}
		 */
		const send = (message) => {
			if (!socket.destroyed && socket.writable) socket.write(`${JSON.stringify(message)}\n`)
		}

		/**
		 * @param {import('@tevm/jsonrpc').JsonRpcRequest<string, any>} request
		 * @returns {Promise<import('@tevm/jsonrpc').JsonRpcResponse<any, any, any> | undefined>}
		 */
		const dispatch = async (request) => {
			const [response] = await handleBulkRequest(client, [request], { suppressNotifications: true })
			if (
				request.method === 'eth_subscribe' &&
				response &&
				'result' in response &&
				typeof response.result === 'string' &&
				Array.isArray(request.params)
			) {
				const removeListener = createIpcSubscription(tevm, response.result, request.params, send)
				subscriptions.set(response.result, removeListener)
			}
			if (
				request.method === 'eth_unsubscribe' &&
				response &&
				'result' in response &&
				response.result === true &&
				Array.isArray(request.params) &&
				typeof request.params[0] === 'string'
			) {
				subscriptions.get(request.params[0])?.()
				subscriptions.delete(request.params[0])
			}
			return response
		}

		/**
		 * @param {string} frame
		 * @returns {Promise<void>}
		 */
		const handleFrame = async (frame) => {
			const parsed = parseRequest(frame, {
				allowEmptyBatch: false,
				maxBatchSize,
				requireJsonrpc: true,
			})
			if (parsed instanceof InvalidJsonError || parsed instanceof InvalidRequestError) {
				tevm.logger.error(parsed)
				send({
					error: { code: parsed.code, message: parsed.message },
					id: null,
					jsonrpc: '2.0',
					method: 'unknown',
				})
				return
			}

			if (Array.isArray(parsed)) {
				const responses = (await Promise.all(parsed.map((request) => dispatch(/** @type {any} */ (request))))).filter(
					(response) => response !== undefined,
				)
				if (responses.length > 0) send(responses)
				return
			}

			const response = await dispatch(/** @type {any} */ (parsed))
			if (response !== undefined) send(response)
		}

		/** @param {Buffer} chunk */
		const onData = (chunk) => {
			buffer += decoder.write(chunk)
			if (Buffer.byteLength(buffer, 'utf8') > maxMessageSize) {
				const error = new InvalidRequestError(`IPC message exceeds configured max message size of ${maxMessageSize}`)
				tevm.logger.error(error)
				send({
					error: { code: error.code, message: error.message },
					id: null,
					jsonrpc: '2.0',
					method: 'unknown',
				})
				buffer = ''
				socket.end()
				return
			}

			const [frames, remaining] = extractJsonRpcFrames(buffer)
			buffer = remaining
			for (const frame of frames) {
				queue = queue
					.then(() => handleFrame(frame))
					.catch((cause) => {
						const error = new InternalError('Unexpected IPC request error', { cause })
						tevm.logger.error(error)
						send({
							error: { code: error.code, message: error.message },
							id: null,
							jsonrpc: '2.0',
							method: 'unknown',
						})
					})
			}
		}

		const cleanup = () => {
			const subscriptionIds = [...subscriptions.keys()]
			for (const removeListener of subscriptions.values()) removeListener()
			subscriptions.clear()
			for (const subscriptionId of subscriptionIds) {
				void handleBulkRequest(
					client,
					[
						{
							id: null,
							jsonrpc: '2.0',
							method: 'eth_unsubscribe',
							params: [subscriptionId],
						},
					],
					{ suppressNotifications: true },
				)
			}
		}

		socket.on('data', onData)
		socket.once('close', cleanup)
		socket.once('error', (error) => tevm.logger.error(error))
	}
}
