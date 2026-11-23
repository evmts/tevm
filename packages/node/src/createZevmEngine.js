import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { NativeRpcError } from './NativeRpcError.js'

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
	/** @param {import('./ZevmEngine.js').EngineRequest} request */
	const execute = async (request) => {
		const response = JSON.parse(
			/** @type {string} */ (await backend.rpc(JSON.stringify({ jsonrpc: '2.0', id: ++id, ...request }))),
		)
		if (response.error) throw new NativeRpcError(response.error)
		return /** @type {import('./ZevmEngine.js').JsonValue} */ (response.result)
	}
	let lastBlock = 0n
	// Poll only while subscribed: native interval mining happens on a background thread.
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let blockTimer
	const emitBlocks = async () => {
		const after = BigInt(/** @type {string} */ (await execute({ method: 'eth_blockNumber' })))
		const before = lastBlock
		lastBlock = after
		for (let number = before + 1n; number <= after; number++) {
			events.emit(
				'block',
				await execute({ method: 'eth_getBlockByNumber', params: [`0x${number.toString(16)}`, false] }),
			)
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
		void enqueue(async () => {
			if (!closed) lastBlock = BigInt(/** @type {string} */ (await execute({ method: 'eth_blockNumber' })))
		})
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
			clearInterval(blockTimer)
			await backend.close()
			closed = true
			throw error
		}
	})
	// Keep initialization failures observable through ready/request without an
	// unhandled rejection if the consumer first awaits another operation.
	ready.catch(() => {})
	return {
		events,
		ready: () => ready,
		request: async (request) => {
			await ready
			return enqueue(async () => {
				if (closed) throw new Error('engine is closed')
				events.emit('request', request)
				const response = JSON.parse(
					/** @type {string} */ (await dispatch(JSON.stringify({ jsonrpc: '2.0', id: ++id, ...request }))),
				)
				if (response.error) throw new NativeRpcError(response.error)
				const result = /** @type {import('./ZevmEngine.js').JsonValue} */ (response.result)
				events.emit('response', { request, result })
				return result
			})
		},
		rpc: async (json) => {
			await ready
			return enqueue(async () => {
				if (closed) throw new Error('engine is closed')
				return dispatch(json)
			})
		},
		close: () =>
			enqueue(async () => {
				if (closed) return
				closed = true
				clearInterval(blockTimer)
				await backend.close()
				events.emit('close')
				events.removeAllListeners()
			}),
	}
}
