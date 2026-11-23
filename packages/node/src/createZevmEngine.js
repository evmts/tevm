import { decodeHardhatConsoleLog } from '@tevm/utils'
import { createEventEmitter } from './createEventEmitter.js'
import { NativeRpcError } from './NativeRpcError.js'

/** Requests that execute EVM code and may capture Hardhat `console.log` calls. */
const CONSOLE_LOG_METHODS = new Set(['eth_call', 'eth_estimateGas', 'eth_sendTransaction', 'eth_sendRawTransaction'])

/** Milliseconds between block polls while a `block` listener is subscribed. */
const BLOCK_POLL_INTERVAL = 50

/** Largest block gap replayed one block at a time. A larger gap emits only the tip block. */
const MAX_BLOCK_REPLAY = 64n

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
 * Copy a JSON-RPC payload for an observer, so a listener that mutates it cannot change the
 * dispatched request or the caller's result. Falls back to a JSON round trip where
 * `structuredClone` is missing or rejects the value.
 * @template T
 * @param {T} value
 * @returns {T}
 */
const snapshot = (value) => {
	try {
		return structuredClone(value)
	} catch {
		return JSON.parse(JSON.stringify(value))
	}
}

/**
 * Resolve the module that `createRequire` resolves `@evmts/zevm` from. A CommonJS bundle has no
 * `import.meta.url` (esbuild compiles it to `undefined`), so it uses `__filename`.
 * @returns {string}
 */
const requireBase = () => {
	const url = /** @type {string | undefined} */ (import.meta.url)
	if (typeof url === 'string' && url !== '') return url
	if (typeof __filename === 'string' && __filename !== '') return __filename
	return `${/** @type {any} */ (globalThis).process.cwd()}/package.json`
}

/**
 * Load `NativeNode` from the optional `@evmts/zevm` dependency without a static `node:` import,
 * so browser and WASM bundles of this module contain no Node built-ins.
 * @returns {new (config: {chain_id?: number}) => import('./ZevmEngine.js').ZevmBackend}
 * @throws {Error} Outside Node.js, or when `@evmts/zevm` is not installed.
 */
const loadNativeNode = () => {
	const getBuiltinModule = /** @type {{getBuiltinModule?: (id: string) => any} | undefined} */ (
		/** @type {any} */ (globalThis).process
	)?.getBuiltinModule
	const nodeModule = typeof getBuiltinModule === 'function' ? getBuiltinModule('node:module') : undefined
	if (typeof nodeModule?.createRequire !== 'function')
		throw new Error(
			'@tevm/node cannot load the native ZEVM addon in this environment. The default backend requires Node.js >= 22.12. In a browser or WASM host, pass a `backend` that implements `{ rpc(json), close() }`: createZevmEngine({ backend }).',
		)
	try {
		return nodeModule.createRequire(requireBase())('@evmts/zevm').NativeNode
	} catch (cause) {
		const error = /** @type {{code?: unknown; message?: unknown}} */ (cause)
		if (error?.code !== 'MODULE_NOT_FOUND' || !String(error.message).includes('@evmts/zevm')) throw cause
		throw new Error(
			'@tevm/node could not find the optional dependency `@evmts/zevm`. Install `@evmts/zevm` for the native backend, or pass a `backend` that implements `{ rpc(json), close() }`.',
			{ cause },
		)
	}
}

/**
 * Create an isolated ZEVM engine with serialized JSON-RPC and events.
 * Uses a caller-supplied pluggable `backend` (such as a WASM EVM adapter) when
 * provided, and defaults to `@evmts/zevm`'s `NativeNode` otherwise. The native
 * addon is loaded only when no `backend` is given, so this module bundles for browsers.
 * Event listeners and the `consoleLog` handler are observers: their errors and async rejections
 * are delivered to `error` listeners and never change an RPC result. `request` and `response`
 * listeners receive copies of the payload, so mutating one changes neither the dispatched
 * request nor the caller's result.
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
 * @example
 * import { createZevmEngine } from '@tevm/node'
 * // Browser or WASM host: inject the backend. No Node built-in or native addon is loaded.
 * const engine = createZevmEngine({ backend: { rpc: (json) => wasm.rpc(json), close: () => wasm.free() } })
 * await engine.close()
 */
export function createZevmEngine(options = {}) {
	for (const [name, value] of Object.entries({
		chainId: options.chainId,
		'common.id': options.common?.id,
		interval: options.mining?.interval,
		blockNumber: options.fork?.blockNumber,
	})) {
		if (value !== undefined && (!Number.isSafeInteger(value) || value < 0))
			throw new TypeError(`${name} must be an unsigned safe integer`)
	}
	if (options.chainId !== undefined && options.common?.id !== undefined && options.chainId !== options.common.id)
		throw new TypeError(
			`chainId (${options.chainId}) conflicts with common.id (${options.common.id}); pass one, or make them equal`,
		)
	const chainId = options.chainId ?? options.common?.id
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
		const NativeNode = loadNativeNode()
		backend = new NativeNode(chainId === undefined ? {} : { chain_id: chainId })
	}
	let closed = false
	let id = 0
	/** @type {Promise<unknown>} */
	let queue = Promise.resolve()
	let lastBlock = 0n
	// Counts block subscriptions (first listener added). `baselined` names the subscription
	// `lastBlock` belongs to, so a new subscription never replays blocks mined before it.
	let subscription = 0
	let baselined = 0
	// Poll only while subscribed: native interval mining happens on a background thread.
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let blockTimer
	// True while a timer poll is queued or running, so a slow backend never accumulates polls.
	let pollPending = false
	/** @template T @param {() => T | Promise<T>} operation @returns {Promise<Awaited<T>>} */
	const enqueue = (operation) => {
		const result = queue.then(operation)
		queue = result.catch(() => {})
		return /** @type {Promise<Awaited<T>>} */ (result)
	}
	/** @type {import('./ZevmEngine.js').ZevmEngine['events']} */
	const events = createEventEmitter({
		onListenerError: (error, event) => {
			if (event !== 'error') reportError(error)
		},
		onChange: (event) => {
			if (event !== 'block') return
			if (events.listenerCount('block') === 0) {
				clearInterval(blockTimer)
				blockTimer = undefined
				return
			}
			if (blockTimer || closed) return
			subscription++
			// The first emitBlocks of a subscription only records its baseline.
			void enqueue(pollBlocks)
			blockTimer = setInterval(() => {
				if (pollPending) return
				pollPending = true
				void enqueue(pollBlocks).finally(() => {
					pollPending = false
				})
			}, BLOCK_POLL_INTERVAL)
			// Node timers keep the process alive unless unref'd. Browser timers are numbers.
			const timer = /** @type {{unref?: unknown}} */ (blockTimer)
			if (typeof timer?.unref === 'function') timer.unref()
		},
	})
	/** Deliver an observer failure to `error` listeners. @param {unknown} error */
	const reportError = (error) => {
		if (events.listenerCount('error') > 0) events.emit('error', error)
	}
	/**
	 * Run post-dispatch observer work. Its failure is reported and never reaches the RPC caller.
	 * @param {() => Promise<void>} work
	 */
	const observe = async (work) => {
		try {
			await work()
		} catch (error) {
			reportError(error)
		}
	}
	/**
	 * Run synchronous observer delivery. A payload that cannot be copied is reported, never thrown.
	 * @param {() => void} deliver
	 */
	const notify = (deliver) => {
		try {
			deliver()
		} catch (error) {
			reportError(error)
		}
	}
	/**
	 * Decode one JSON-RPC response. A backend that answers with anything other than a JSON-RPC 2.0
	 * response to request `expectedId` is a transport fault, so it throws instead of yielding `undefined`.
	 * An error response may carry a null id: the backend could not read the request id.
	 * @param {string | null} json
	 * @param {number} expectedId
	 * @returns {import('./ZevmEngine.js').JsonValue}
	 */
	const parseResponse = (json, expectedId) => {
		const response = JSON.parse(/** @type {string} */ (json))
		if (response === null || typeof response !== 'object' || Array.isArray(response))
			throw new Error('backend returned an invalid JSON-RPC response')
		if (response.jsonrpc !== '2.0')
			throw new Error('backend returned an invalid JSON-RPC response: jsonrpc must be "2.0"')
		const hasResult = 'result' in response
		const hasError = 'error' in response
		if (response.id !== expectedId && !(response.id === null && hasError && !hasResult))
			throw new Error(
				`backend returned a JSON-RPC response with id ${JSON.stringify(response.id)} for request id ${expectedId}`,
			)
		// JSON-RPC 2.0: exactly one of `result` and `error` is present.
		if (hasResult === hasError)
			throw new Error(
				`backend returned an invalid JSON-RPC response: ${hasResult ? 'both `result` and `error` are present' : 'neither `result` nor `error` is present'}`,
			)
		if (!hasError) return response.result
		const error = response.error
		if (
			error === null ||
			typeof error !== 'object' ||
			Array.isArray(error) ||
			!Number.isInteger(error.code) ||
			typeof error.message !== 'string'
		)
			throw new Error(
				'backend returned an invalid JSON-RPC response: error must be an object with an integer `code` and a string `message`',
			)
		throw new NativeRpcError(error)
	}
	/**
	 * Send one request to the backend. `jsonrpc` and `id` are written last so caller fields cannot replace them.
	 * @param {import('./ZevmEngine.js').EngineRequest} request
	 */
	const execute = async (request) => {
		const requestId = ++id
		return parseResponse(await backend.rpc(JSON.stringify({ ...request, jsonrpc: '2.0', id: requestId })), requestId)
	}
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
			// A throwing handler must not drop the remaining drained messages.
			try {
				if (typeof consoleLog === 'function') {
					const returned = /** @type {unknown} */ (
						consoleLog(event.message, { calldata: event.calldata, args: event.args })
					)
					// An async handler's rejection is reported instead of becoming an unhandled rejection.
					const then =
						returned !== null && (typeof returned === 'object' || typeof returned === 'function')
							? /** @type {{then?: unknown}} */ (returned).then
							: undefined
					if (typeof then === 'function') then.call(returned, undefined, reportError)
				} else console.log(event.message)
			} catch (error) {
				reportError(error)
			}
		}
	}
	const emitBlocks = async () => {
		const current = subscription
		const after = BigInt(/** @type {string} */ (await execute({ method: 'eth_blockNumber' })))
		if (current !== subscription) return
		if (baselined !== current || after < lastBlock) {
			baselined = current
			lastBlock = after
			return
		}
		// Bound the synchronous work of one poll: after a large jump, emit only the tip block.
		if (after - lastBlock > MAX_BLOCK_REPLAY) lastBlock = after - 1n
		while (lastBlock < after) {
			const number = lastBlock + 1n
			const block = await execute({ method: 'eth_getBlockByNumber', params: [`0x${number.toString(16)}`, false] })
			if (current !== subscription) return
			// A missing block is retried by the next poll. Never advance past it.
			if (block === null) return
			// Advance one block at a time: a failed fetch is retried by the next poll instead of skipped.
			lastBlock = number
			events.emit('block', block)
		}
	}
	const pollBlocks = async () => {
		if (!closed && events.listenerCount('block') > 0) await observe(emitBlocks)
	}
	/** Close the backend once, emit `close`, and drop every listener. */
	const shutdown = async () => {
		if (closed) return
		// Mark closed before awaiting the backend so a listener added meanwhile starts no timer.
		closed = true
		clearInterval(blockTimer)
		blockTimer = undefined
		try {
			await backend.close()
		} finally {
			// The engine is closed even when the backend fails to release its resources.
			events.emit('close')
			events.removeAllListeners()
		}
	}
	const ready = enqueue(async () => {
		try {
			if (options.backend !== undefined && chainId !== undefined) {
				// An injected backend owns its chain ID. Reject a mismatch instead of ignoring `chainId`.
				/** @type {import('./ZevmEngine.js').JsonValue | undefined} */
				let actual
				try {
					actual = await execute({ method: 'eth_chainId' })
				} catch (error) {
					// A backend without eth_chainId cannot be checked.
					if (!(error instanceof NativeRpcError && error.code === -32601)) throw error
				}
				if (
					actual !== undefined &&
					(typeof actual !== 'string' || !/^0x[0-9a-fA-F]+$/.test(actual) || BigInt(actual) !== BigInt(chainId))
				)
					throw new Error(
						`backend reports chain ID ${JSON.stringify(actual)} but chainId is ${chainId}; configure the backend with the same chain ID or omit chainId`,
					)
			}
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
			try {
				await shutdown()
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
		request: async (request) => {
			const method = request?.method
			if (!request || typeof request !== 'object' || typeof method !== 'string')
				throw new TypeError('invalid request: expected an object with a string `method`')
			const submitted = snapshot({ ...request, method })
			return enqueue(async () => {
				await ready
				if (closed) throw new Error('engine is closed')
				// Serialize before any observer runs: a listener cannot change the dispatched request.
				const requestId = ++id
				const json = JSON.stringify({ ...submitted, jsonrpc: '2.0', id: requestId })
				if (events.listenerCount('request') > 0) notify(() => events.emit('request', snapshot(submitted)))
				// Drain even when execution fails: Hardhat prints logs emitted before a revert.
				// Observer work in `finally` never throws, so it cannot replace the result or mask the error.
				try {
					const response = await backend.rpc(json)
					await pollBlocks()
					const result = parseResponse(response, requestId)
					// Listeners receive copies, so they cannot change the result returned to the caller.
					if (events.listenerCount('response') > 0)
						notify(() => events.emit('response', { request: submitted, result: snapshot(result) }))
					return result
				} finally {
					if (CONSOLE_LOG_METHODS.has(method)) await observe(drainConsoleLogs)
				}
			})
		},
		rpc: (json) =>
			enqueue(async () => {
				await ready
				if (closed) throw new Error('engine is closed')
				try {
					const response = await backend.rpc(json)
					await pollBlocks()
					return response
				} finally {
					if (consoleLogSupported && executesConsoleLogMethod(json)) await observe(drainConsoleLogs)
				}
			}),
		close: () => enqueue(shutdown),
	}
}
