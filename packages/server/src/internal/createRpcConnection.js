/** @typedef {{jsonrpc: '2.0'; id: unknown; method: 'eth_subscribe' | 'eth_unsubscribe'; params?: import('@tevm/node').JsonValue[]}} SubscriptionRequest */

/** @param {unknown} value @returns {value is SubscriptionRequest} */
const isSubscriptionRequest = (value) =>
	value !== null &&
	typeof value === 'object' &&
	'jsonrpc' in value &&
	value.jsonrpc === '2.0' &&
	'id' in value &&
	'method' in value &&
	(value.method === 'eth_subscribe' || value.method === 'eth_unsubscribe')

/**
 * Connection-scoped subscriptions backed by native filters. The host only
 * delivers events; ZEVM selects and stores logs, blocks and pending transactions.
 * @param {Pick<import('@tevm/node').ZevmEngine, 'request' | 'rpc'>} engine
 * @param {(json: string) => void} send
 * @returns {{rpc: (json: string) => Promise<void>; close: () => Promise<void>}}
 */
export function createRpcConnection(engine, send) {
	/** @type {Map<string, {kind: string; filter?: string; last?: string}>} */
	const subscriptions = new Map()
	let nextId = 0
	let closed = false
	let polling = false
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let timer

	/** @param {string} id @param {import('@tevm/node').JsonValue} result */
	const notify = (id, result) => {
		if (!closed && subscriptions.has(id))
			send(JSON.stringify({ jsonrpc: '2.0', method: 'eth_subscription', params: { subscription: id, result } }))
	}
	const poll = async () => {
		if (polling || closed) return
		polling = true
		try {
			for (const [id, subscription] of subscriptions) {
				try {
					if (subscription.kind === 'syncing') {
						const result = await engine.request({ method: 'eth_syncing' })
						const state = JSON.stringify(result)
						if (state !== subscription.last) {
							subscription.last = state
							notify(id, result)
						}
						continue
					}
					const changes = /** @type {import('@tevm/node').JsonValue[]} */ (
						await engine.request({ method: 'eth_getFilterChanges', params: [subscription.filter ?? ''] })
					)
					for (const change of changes) {
						const result =
							subscription.kind === 'newHeads'
								? await engine.request({ method: 'eth_getBlockByHash', params: [change, false] })
								: change
						notify(id, result)
					}
				} catch {
					// A failed filter must not prevent polling the remaining subscriptions.
				}
			}
		} finally {
			polling = false
		}
	}
	const stopTimer = () => {
		clearInterval(timer)
		timer = undefined
	}
	/** @param {SubscriptionRequest} request */
	const dispatch = async (request) => {
		const { id, params } = request
		if (id !== null && typeof id !== 'string' && typeof id !== 'number')
			return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } }
		const invalidParams = { jsonrpc: '2.0', id, error: { code: -32602, message: 'Invalid params' } }
		if (!Array.isArray(params)) return invalidParams
		try {
			if (request.method === 'eth_unsubscribe') {
				if (params.length !== 1 || typeof params[0] !== 'string') return invalidParams
				const subscription = subscriptions.get(params[0])
				subscriptions.delete(params[0])
				if (!subscriptions.size) stopTimer()
				if (subscription?.filter) await engine.request({ method: 'eth_uninstallFilter', params: [subscription.filter] })
				return { jsonrpc: '2.0', id, result: subscription !== undefined }
			}
			const kind = params[0]
			if (typeof kind !== 'string' || !['newHeads', 'logs', 'newPendingTransactions', 'syncing'].includes(kind))
				return invalidParams
			if (params.length > (kind === 'logs' ? 2 : 1)) return invalidParams
			if (params.length === 2 && (params[1] === null || typeof params[1] !== 'object' || Array.isArray(params[1])))
				return invalidParams

			const result = `0x${(++nextId).toString(16)}`
			if (kind === 'syncing') {
				const last = JSON.stringify(await engine.request({ method: 'eth_syncing' }))
				if (!closed) subscriptions.set(result, { kind, last })
			} else {
				const method =
					kind === 'newHeads'
						? 'eth_newBlockFilter'
						: kind === 'logs'
							? 'eth_newFilter'
							: 'eth_newPendingTransactionFilter'
				const filter = /** @type {string} */ (
					await engine.request({ method, params: kind === 'logs' ? [params[1] ?? {}] : [] })
				)
				if (closed) await engine.request({ method: 'eth_uninstallFilter', params: [filter] })
				else subscriptions.set(result, { kind, filter })
			}
			if (!closed && !timer) {
				timer = setInterval(poll, 50)
				timer.unref()
			}
			return { jsonrpc: '2.0', id, result }
		} catch (error) {
			const cause = /** @type {{code?: number; shortMessage?: string; message?: string; data?: unknown} | null} */ (
				error
			)
			return {
				jsonrpc: '2.0',
				id,
				error: {
					code: Number.isInteger(cause?.code) ? cause?.code : -32603,
					message: cause?.shortMessage ?? cause?.message ?? 'Internal error',
					...(cause?.data === undefined ? {} : { data: cause.data }),
				},
			}
		}
	}
	return {
		rpc: async (json) => {
			let value
			try {
				value = JSON.parse(json)
			} catch {
				/* Forward parse errors to ZEVM. */
			}
			let response
			if (isSubscriptionRequest(value)) response = JSON.stringify(await dispatch(value))
			else if (Array.isArray(value) && value.some(isSubscriptionRequest)) {
				const responses = []
				for (const item of value) {
					if (isSubscriptionRequest(item)) responses.push(await dispatch(item))
					else {
						// Keep native batch-member validation, including invalid nested arrays and notifications.
						const native = await engine.rpc(JSON.stringify([item]))
						if (native !== null) responses.push(...JSON.parse(native))
					}
				}
				response = responses.length ? JSON.stringify(responses) : null
			} else response = await engine.rpc(json)
			if (response !== null && !closed) send(response)
		},
		close: async () => {
			closed = true
			stopTimer()
			const active = Array.from(subscriptions.values())
			subscriptions.clear()
			for (const { filter } of active) {
				if (filter) await engine.request({ method: 'eth_uninstallFilter', params: [filter] }).catch(() => {})
			}
		},
	}
}
