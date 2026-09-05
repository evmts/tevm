/**
 * Connection-scoped subscriptions backed by native filters. The host only
 * delivers events; ZEVM selects and stores logs, blocks and pending transactions.
 * @param {import('@tevm/node').ZevmEngine} engine
 * @param {(json: string) => void} send
 * @returns {{rpc: (json: string) => Promise<void>; close: () => Promise<void>}}
 */
export function createRpcConnection(engine, send) {
	/** @type {Map<string, {kind: string; filter?: string; last?: string}>} */
	const subscriptions = new Map()
	let nextId = 0
	let closed = false
	let polling = false
	/** @param {string} id @param {import('@tevm/node').JsonValue} result */
	const notify = (id, result) => {
		if (!closed)
			send(JSON.stringify({ jsonrpc: '2.0', method: 'eth_subscription', params: { subscription: id, result } }))
	}
	const timer = setInterval(async () => {
		if (polling || closed) return
		polling = true
		try {
			for (const [id, subscription] of subscriptions) {
				if (subscription.kind === 'syncing') {
					const result = await engine.request({ method: 'eth_syncing' })
					if (JSON.stringify(result) !== subscription.last) {
						subscription.last = JSON.stringify(result)
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
			}
		} catch {
			/* A closed/reset engine invalidates native filters. */
		} finally {
			polling = false
		}
	}, 50)
	timer.unref()
	/** @param {unknown} value @returns {Promise<unknown>} */
	const dispatch = async (value) => {
		const request =
			/** @type {{jsonrpc?: string; id?: string | number | null; method?: string; params?: import('@tevm/node').JsonValue[]}} */ (
				value
			)
		if (
			!request ||
			request.jsonrpc !== '2.0' ||
			request.id === undefined ||
			!['eth_subscribe', 'eth_unsubscribe'].includes(request.method ?? '')
		) {
			const response = await engine.rpc(JSON.stringify(value))
			return response === null ? undefined : JSON.parse(response)
		}
		try {
			const params = request.params
			if (!Array.isArray(params)) throw new TypeError('Invalid params')
			if (request.method === 'eth_unsubscribe') {
				if (params.length !== 1 || typeof params[0] !== 'string') throw new TypeError('Invalid params')
				const subscription = subscriptions.get(params[0])
				subscriptions.delete(params[0])
				if (subscription?.filter) await engine.request({ method: 'eth_uninstallFilter', params: [subscription.filter] })
				return { jsonrpc: '2.0', id: request.id, result: subscription !== undefined }
			}
			const kind = params[0]
			if (typeof kind !== 'string' || !['newHeads', 'logs', 'newPendingTransactions', 'syncing'].includes(kind))
				throw new TypeError('Invalid params')
			const method =
				kind === 'newHeads'
					? 'eth_newBlockFilter'
					: kind === 'logs'
						? 'eth_newFilter'
						: 'eth_newPendingTransactionFilter'
			const filter =
				kind === 'syncing'
					? undefined
					: /** @type {string} */ (await engine.request({ method, params: kind === 'logs' ? [params[1] ?? {}] : [] }))
			const id = `0x${(++nextId).toString(16)}`
			subscriptions.set(id, { kind, ...(filter === undefined ? {} : { filter }) })
			return { jsonrpc: '2.0', id: request.id, result: id }
		} catch (error) {
			const cause = /** @type {{code?: number; shortMessage?: string; data?: unknown}} */ (error)
			return {
				jsonrpc: '2.0',
				id: request.id,
				error: {
					code: cause.code ?? -32602,
					message: cause.shortMessage ?? 'Invalid params',
					...(cause.data === undefined ? {} : { data: cause.data }),
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
				const response = await engine.rpc(json)
				if (response !== null && !closed) send(response)
				return
			}
			if (Array.isArray(value) && value.length > 0) {
				const responses = []
				for (const request of value) {
					const response = await dispatch(request)
					if (response !== undefined) responses.push(response)
				}
				if (responses.length > 0 && !closed) send(JSON.stringify(responses))
			} else {
				const response = await dispatch(value)
				if (response !== undefined && !closed) send(JSON.stringify(response))
			}
		},
		close: async () => {
			closed = true
			clearInterval(timer)
			for (const subscription of subscriptions.values()) {
				if (subscription.filter)
					await engine.request({ method: 'eth_uninstallFilter', params: [subscription.filter] }).catch(() => {})
			}
			subscriptions.clear()
		},
	}
}
