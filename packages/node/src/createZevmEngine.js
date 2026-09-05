import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { NativeRpcError } from './NativeRpcError.js'

/**
 * Create an isolated native ZEVM engine with serialized JSON-RPC and events.
 * Voltaire owns state and primitives; Guillotine Mini executes bytecode.
 * @param {import('./ZevmEngine.js').ZevmEngineOptions} [options]
 * @returns {import('./ZevmEngine.js').ZevmEngine}
 * @throws {Error} If the native addon is unavailable or configuration is invalid.
 * @example
 * import { createZevmEngine } from '@tevm/node'
 * const engine = createZevmEngine({ chainId: 31337 })
 * console.log(await engine.request({ method: 'eth_blockNumber' }))
 * await engine.close()
 */
export function createZevmEngine(options = {}) {
	const { NativeNode } =
		/** @type {{NativeNode: new (config: {chain_id?: number}) => {rpc: (json: string) => string | null; close: () => void}}} */ (
			createRequire(import.meta.url)('@evmts/zevm')
		)
	for (const [name, value] of Object.entries({
		chainId: options.chainId,
		interval: options.mining?.interval,
		blockNumber: options.fork?.blockNumber,
	})) {
		if (value !== undefined && (!Number.isSafeInteger(value) || value < 0))
			throw new TypeError(`${name} must be an unsigned safe integer`)
	}
	const native = new NativeNode(options.chainId === undefined ? {} : { chain_id: options.chainId })
	const events = new EventEmitter()
	let closed = false
	let id = 0
	/** @type {Promise<unknown>} */
	let queue = Promise.resolve()
	/** @param {import('./ZevmEngine.js').EngineRequest} request */
	const execute = (request) => {
		const response = JSON.parse(
			/** @type {string} */ (native.rpc(JSON.stringify({ jsonrpc: '2.0', id: ++id, ...request }))),
		)
		if (response.error) throw new NativeRpcError(response.error)
		return /** @type {import('./ZevmEngine.js').JsonValue} */ (response.result)
	}
	let lastBlock = 0n
	// Poll only while subscribed: native interval mining happens on a Zig thread.
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let blockTimer
	const emitBlocks = () => {
		const after = BigInt(/** @type {string} */ (execute({ method: 'eth_blockNumber' })))
		const before = lastBlock
		lastBlock = after
		for (let number = before + 1n; number <= after; number++) {
			events.emit('block', execute({ method: 'eth_getBlockByNumber', params: [`0x${number.toString(16)}`, false] }))
		}
	}
	/** @param {string} json */
	const dispatch = (json) => {
		const response = native.rpc(json)
		if (events.listenerCount('block') > 0) emitBlocks()
		return response
	}
	/** @template T @param {() => T} operation @returns {Promise<T>} */
	const enqueue = (operation) => {
		const result = queue.then(operation)
		queue = result.catch(() => {})
		return result
	}
	events.on('newListener', (event) => {
		if (event !== 'block' || blockTimer || closed) return
		void enqueue(() => {
			if (!closed) lastBlock = BigInt(/** @type {string} */ (execute({ method: 'eth_blockNumber' })))
		})
		blockTimer = setInterval(() => {
			void enqueue(() => {
				if (!closed) emitBlocks()
			}).catch(() => {})
		}, 50)
		blockTimer.unref()
	})
	events.on('removeListener', (event) => {
		if (event !== 'block' || events.listenerCount('block') > 0) return
		clearInterval(blockTimer)
		blockTimer = undefined
	})
	const ready = enqueue(() => {
		try {
			if (options.fork)
				execute({
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
			if (options.mining?.auto !== undefined) execute({ method: 'evm_setAutomine', params: [options.mining.auto] })
			if (options.mining?.interval !== undefined)
				execute({ method: 'evm_setIntervalMining', params: [options.mining.interval] })
		} catch (error) {
			clearInterval(blockTimer)
			native.close()
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
			return enqueue(() => {
				if (closed) throw new Error('engine is closed')
				events.emit('request', request)
				const response = JSON.parse(
					/** @type {string} */ (dispatch(JSON.stringify({ jsonrpc: '2.0', id: ++id, ...request }))),
				)
				if (response.error) throw new NativeRpcError(response.error)
				const result = /** @type {import('./ZevmEngine.js').JsonValue} */ (response.result)
				events.emit('response', { request, result })
				return result
			})
		},
		rpc: async (json) => {
			await ready
			return enqueue(() => {
				if (closed) throw new Error('engine is closed')
				return dispatch(json)
			})
		},
		close: () =>
			enqueue(() => {
				if (closed) return
				closed = true
				clearInterval(blockTimer)
				native.close()
				events.emit('close')
				events.removeAllListeners()
			}),
	}
}
