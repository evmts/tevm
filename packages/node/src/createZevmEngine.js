import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { decodeHardhatConsoleLog } from '@tevm/utils'
import { NativeRpcError } from './NativeRpcError.js'

/** Requests that execute EVM code and may capture Hardhat `console.log` calls. */
const CONSOLE_LOG_METHODS = new Set(['eth_call', 'eth_estimateGas', 'eth_sendTransaction', 'eth_sendRawTransaction'])

/** @param {string} json Raw JSON-RPC request, notification, or batch. */
const executesConsoleLogMethod = (json) => {
	try {
		const request = JSON.parse(json)
		return Array.isArray(request)
			? request.some((item) => CONSOLE_LOG_METHODS.has(item?.method))
			: CONSOLE_LOG_METHODS.has(request?.method)
	} catch {
		// The backend owns the parse error response. No method ran.
		return false
	}
}

/**
 * Create an isolated ZEVM engine with serialized JSON-RPC and events.
 * Uses a caller-supplied pluggable `backend` (such as a WASM EVM adapter) when
 * provided, and defaults to `@evmts/zevm`'s `NativeNode` otherwise.
 * @param {import('./ZevmEngine.js').ZevmEngineOptions} [options]
 * @returns {import('./ZevmEngine.js').ZevmEngine}
 * @throws {Error} If configuration is invalid or the default native addon is unavailable.
 * @example
 * import { createZevmEngine } from '@tevm/node'
 * const engine = createZevmEngine({ chainId: 31337 })
 * console.log(await engine.request({ method: 'eth_blockNumber' }))
 * await engine.close()
 * @example
 * import { createZevmEngine } from '@tevm/node'
 * // Print Solidity `console.log` output after eth_call and transaction requests.
 * const engine = createZevmEngine({ consoleLog: (message) => console.log(`[sol] ${message}`) })
 * engine.events.on('consoleLog', ({ signature, args }) => console.log(signature, args))
 * await engine.close()
 */
export function createZevmEngine(options = {}) {
	for (const [name, value] of Object.entries({
		chainId: options.chainId,
		interval: options.mining?.interval,
		blockNumber: options.fork?.blockNumber,
	})) {
		if (value !== undefined && (!Number.isSafeInteger(value) || value < 0))
			throw new TypeError(`${name} must be an unsigned safe integer`)
	}
	if (
		options.consoleLog !== undefined &&
		typeof options.consoleLog !== 'boolean' &&
		typeof options.consoleLog !== 'function'
	)
		throw new TypeError('consoleLog must be a boolean or a function')
	/** @type {import('./ZevmEngine.js').ZevmBackend} */
	let backend
	if (options.backend !== undefined) {
		if (typeof options.backend?.rpc !== 'function' || typeof options.backend?.close !== 'function') {
			throw new TypeError('backend must implement rpc(json) and close()')
		}
		backend = options.backend
	} else {
		const { NativeNode } =
			/** @type {{NativeNode: new (config: {chain_id?: number}) => import('./ZevmEngine.js').ZevmBackend}} */ (
				createRequire(import.meta.url)('@evmts/zevm')
			)
		backend = new NativeNode(options.chainId === undefined ? {} : { chain_id: options.chainId })
	}
	const events = new EventEmitter()
	let closed = false
	let id = 0
	/** @type {Promise<unknown>} */
	let queue = Promise.resolve()
	/**
	 * Decode one JSON-RPC response. A backend that answers with anything other than a
	 * response object is a transport fault, so it throws instead of yielding `undefined`.
	 * @param {string | null} json
	 * @returns {import('./ZevmEngine.js').JsonValue}
	 */
	const parseResponse = (json) => {
		const response = JSON.parse(/** @type {string} */ (json))
		if (response === null || typeof response !== 'object' || Array.isArray(response))
			throw new Error('backend returned an invalid JSON-RPC response')
		if (response.error) throw new NativeRpcError(response.error)
		if (!('result' in response)) throw new Error('backend returned an invalid JSON-RPC response')
		return response.result
	}
	/** @param {import('./ZevmEngine.js').EngineRequest} request */
	const execute = async (request) =>
		parseResponse(await backend.rpc(JSON.stringify({ jsonrpc: '2.0', id: ++id, ...request })))
	const consoleLog = options.consoleLog
	// Cleared when the native engine predates console capture (-32601), so later requests skip the drain.
	let consoleLogSupported = Boolean(consoleLog)
	const drainConsoleLogs = async () => {
		if (!consoleLogSupported) return
		/** @type {import('./ZevmEngine.js').JsonValue} */
		let entries
		try {
			entries = await execute({ method: 'tevm_drainConsoleLogs', params: [] })
		} catch (error) {
			if (error instanceof NativeRpcError && error.code === -32601) {
				consoleLogSupported = false
				return
			}
			throw error
		}
		if (!Array.isArray(entries)) return
		for (const calldata of entries) {
			if (typeof calldata !== 'string') continue
			const decoded = decodeHardhatConsoleLog(/** @type {`0x${string}`} */ (calldata))
			if (!decoded) continue
			/** @type {import('./ConsoleLogEvent.js').ConsoleLogEvent} */
			const event = {
				message: decoded.formatted,
				signature: decoded.signature,
				calldata: /** @type {`0x${string}`} */ (calldata),
				args: decoded.args,
			}
			events.emit('consoleLog', event)
			if (typeof consoleLog === 'function') consoleLog(event.message, { calldata: event.calldata, args: event.args })
			else console.log(event.message)
		}
	}
	let lastBlock = 0n
	// Counts block subscriptions (first listener added). `baselined` names the subscription
	// `lastBlock` belongs to, so a new subscription never replays blocks mined before it.
	let subscription = 0
	let baselined = 0
	// Poll only while subscribed: native interval mining happens on a background thread.
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let blockTimer
	const emitBlocks = async () => {
		const current = subscription
		const after = BigInt(/** @type {string} */ (await execute({ method: 'eth_blockNumber' })))
		if (current !== subscription) return
		if (baselined !== current || after < lastBlock) {
			baselined = current
			lastBlock = after
			return
		}
		while (lastBlock < after) {
			const number = lastBlock + 1n
			const block = await execute({ method: 'eth_getBlockByNumber', params: [`0x${number.toString(16)}`, false] })
			if (current !== subscription) return
			// Advance one block at a time: a failed fetch is retried by the next poll instead of skipped.
			lastBlock = number
			events.emit('block', block)
		}
	}
	/** @param {string} json */
	const dispatch = async (json) => {
		const response = await backend.rpc(json)
		if (events.listenerCount('block') > 0) await emitBlocks()
		return response
	}
	/** @template T @param {() => T | Promise<T>} operation @returns {Promise<Awaited<T>>} */
	const enqueue = (operation) => {
		const result = queue.then(operation)
		queue = result.catch(() => {})
		return /** @type {Promise<Awaited<T>>} */ (result)
	}
	events.on('newListener', (event) => {
		if (event !== 'block' || blockTimer || closed) return
		subscription++
		// The first emitBlocks of a subscription only records its baseline.
		void enqueue(async () => {
			if (!closed) await emitBlocks()
		}).catch(() => {})
		blockTimer = setInterval(() => {
			void enqueue(async () => {
				if (!closed) await emitBlocks()
			}).catch(() => {})
		}, 50)
		blockTimer.unref()
	})
	events.on('removeListener', (event) => {
		if (event !== 'block' || events.listenerCount('block') > 0) return
		clearInterval(blockTimer)
		blockTimer = undefined
	})
	const ready = enqueue(async () => {
		try {
			if (options.fork)
				await execute({
					method: 'anvil_reset',
					params: [
						{
							forking: {
								jsonRpcUrl: options.fork.url,
								...(options.fork.blockNumber === undefined ? {} : { blockNumber: options.fork.blockNumber }),
							},
						},
					],
				})
			if (options.mining?.auto !== undefined)
				await execute({ method: 'evm_setAutomine', params: [options.mining.auto] })
			if (options.mining?.interval !== undefined)
				await execute({ method: 'evm_setIntervalMining', params: [options.mining.interval] })
		} catch (error) {
			// Mark closed before awaiting the backend so a listener added meanwhile starts no timer.
			closed = true
			clearInterval(blockTimer)
			try {
				await backend.close()
			} catch {
				// The initialization failure is the error callers need.
			}
			throw error
		}
	})
	// Keep initialization failures observable through ready/request without an
	// unhandled rejection if the consumer first awaits another operation.
	ready.catch(() => {})
	return {
		events,
		ready: () => ready,
		// Enqueue synchronously so calls run in the order they were issued, including
		// relative to close(). Initialization is first in the queue and has settled by then.
		request: (request) =>
			enqueue(async () => {
				await ready
				if (closed) throw new Error('engine is closed')
				events.emit('request', request)
				// Drain even when execution fails: Hardhat prints logs emitted before a revert.
				try {
					const result = parseResponse(await dispatch(JSON.stringify({ jsonrpc: '2.0', id: ++id, ...request })))
					events.emit('response', { request, result })
					return result
				} finally {
					if (CONSOLE_LOG_METHODS.has(request.method)) await drainConsoleLogs()
				}
			}),
		rpc: (json) =>
			enqueue(async () => {
				await ready
				if (closed) throw new Error('engine is closed')
				try {
					return await dispatch(json)
				} finally {
					if (consoleLogSupported && executesConsoleLogMethod(json)) await drainConsoleLogs()
				}
			}),
		close: () =>
			enqueue(async () => {
				if (closed) return
				closed = true
				clearInterval(blockTimer)
				try {
					await backend.close()
				} finally {
					// The engine is closed even when the backend fails to release its resources.
					try {
						events.emit('close')
					} finally {
						events.removeAllListeners()
					}
				}
			}),
	}
}
