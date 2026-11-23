import { createZevmEngine, type EngineRequest } from '@tevm/node'
import { expect, it, vi } from 'vitest'
import { createRpcConnection } from './createRpcConnection.js'

it('finishes subscription cleanup when the native engine has already closed', async () => {
	const engine = createZevmEngine()
	const responses: unknown[] = []
	const connection = createRpcConnection(engine, (json) => responses.push(JSON.parse(json)))
	try {
		await connection.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['logs'] }))
		expect(responses).toEqual([{ jsonrpc: '2.0', id: 1, result: '0x1' }])
		await engine.close()
		await expect(connection.close()).resolves.toBeUndefined()
		await expect(connection.close()).resolves.toBeUndefined()
	} finally {
		await connection.close()
		await engine.close()
	}
})

it('polls only active subscriptions, isolates failed filters and emits syncing changes', async () => {
	vi.useFakeTimers()
	let filters = 0
	let syncing = false
	const engine = {
		rpc: async () => null,
		request: async ({ method, params }: EngineRequest) => {
			if (method === 'eth_newPendingTransactionFilter') return String(++filters)
			if (method === 'eth_syncing') return syncing
			if (method === 'eth_getFilterChanges' && params?.[0] === '1') throw new Error('filter expired')
			if (method === 'eth_getFilterChanges') return ['0xab']
			return true
		},
	}
	const messages: unknown[] = []
	const conn = createRpcConnection(engine, (json) => messages.push(JSON.parse(json)))
	const call = (method: string, params: unknown[]) =>
		conn.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }))
	try {
		expect(vi.getTimerCount()).toBe(0)
		await call('eth_subscribe', ['newPendingTransactions'])
		await call('eth_subscribe', ['newPendingTransactions'])
		await call('eth_subscribe', ['syncing'])
		expect(vi.getTimerCount()).toBe(1)
		messages.length = 0
		await vi.advanceTimersByTimeAsync(50)
		expect(messages).toEqual([
			{ jsonrpc: '2.0', method: 'eth_subscription', params: { subscription: '0x2', result: '0xab' } },
		])
		syncing = true
		await vi.advanceTimersByTimeAsync(50)
		expect(messages.at(-1)).toEqual({
			jsonrpc: '2.0',
			method: 'eth_subscription',
			params: { subscription: '0x3', result: true },
		})
		for (const id of ['0x1', '0x2', '0x3']) await call('eth_unsubscribe', [id])
		expect(vi.getTimerCount()).toBe(0)
	} finally {
		await conn.close()
		vi.useRealTimers()
	}
})

it('preserves native batch boundaries, notifications, subscription errors and validation', async () => {
	const engine = createZevmEngine()
	const native = vi.spyOn(engine, 'rpc')
	const sent: unknown[] = []
	const conn = createRpcConnection(engine, (json) => sent.push(JSON.parse(json)))
	const chain = { jsonrpc: '2.0', id: 1, method: 'eth_chainId' }
	const note = { jsonrpc: '2.0', method: 'eth_chainId' }
	const sub = { jsonrpc: '2.0', id: 's', method: 'eth_subscribe', params: ['newHeads'] }
	try {
		const batch = JSON.stringify([chain, note])
		await conn.rpc(batch)
		expect(native.mock.calls).toEqual([[batch]])
		await conn.rpc(JSON.stringify([note, note]))
		expect(sent).toHaveLength(1)
		vi.spyOn(engine, 'request').mockRejectedValue(
			Object.assign(new Error('backend failed'), { code: -32017, data: '0xab' }),
		)
		await conn.rpc(JSON.stringify([note, sub, chain]))
		expect(sent.at(-1)).toEqual([
			{ jsonrpc: '2.0', id: 's', error: { code: -32017, message: 'backend failed', data: '0xab' } },
			{ jsonrpc: '2.0', id: 1, result: '0x7a69' },
		])
		await conn.rpc(JSON.stringify({ ...sub, id: {} }))
		expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } })
		for (const filter of [null, [], false]) {
			await conn.rpc(JSON.stringify({ ...sub, params: ['logs', filter] }))
			expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: 's', error: { code: -32602, message: 'Invalid params' } })
		}
		await conn.rpc(JSON.stringify({ ...sub, params: ['newHeads', {}] }))
		expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: 's', error: { code: -32602, message: 'Invalid params' } })
	} finally {
		await conn.close()
		await engine.close()
	}
})

it('caps live subscriptions per connection with error -32005, counting installs in flight', async () => {
	let filters = 0
	const uninstalled: unknown[] = []
	const engine = {
		rpc: async () => null,
		request: async ({ method, params }: EngineRequest) => {
			if (method === 'eth_uninstallFilter') uninstalled.push(params?.[0])
			// Yield, so concurrent eth_subscribe calls overlap while their filters install.
			await Promise.resolve()
			return method === 'eth_newBlockFilter' ? `0xf${++filters}` : true
		},
	}
	const sent: any[] = []
	const conn = createRpcConnection(engine, (json) => sent.push(JSON.parse(json)), { maxSubscriptions: 2 })
	const call = (id: number, method: string, params: unknown[]) =>
		conn.rpc(JSON.stringify({ jsonrpc: '2.0', id, method, params }))
	const limit = { code: -32005, message: 'Subscription limit exceeded: at most 2 per connection' }
	try {
		// Three concurrent subscribes: the third is rejected before any filter finishes installing.
		await Promise.all([1, 2, 3].map((id) => call(id, 'eth_subscribe', ['newHeads'])))
		expect(sent.sort((a, b) => a.id - b.id)).toEqual([
			{ jsonrpc: '2.0', id: 1, result: '0x1' },
			{ jsonrpc: '2.0', id: 2, result: '0x2' },
			{ jsonrpc: '2.0', id: 3, error: limit },
		])
		// The rejected subscribe installed no native filter.
		expect(filters).toBe(2)
		await call(4, 'eth_subscribe', ['syncing'])
		expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: 4, error: limit })
		// Unsubscribing frees a slot.
		await call(5, 'eth_unsubscribe', ['0x1'])
		await call(6, 'eth_subscribe', ['newHeads'])
		expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: 6, result: '0x3' })
		await call(7, 'eth_subscribe', ['newHeads'])
		expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: 7, error: limit })
		expect(uninstalled).toEqual(['0xf1'])
	} finally {
		await conn.close()
	}
})

it('defaults the subscription cap to 256 and validates maxSubscriptions', async () => {
	const engine = { rpc: async () => null, request: async () => '0x1' }
	const sent: any[] = []
	const conn = createRpcConnection(engine, (json) => sent.push(JSON.parse(json)))
	try {
		for (let id = 1; id <= 257; id++)
			await conn.rpc(JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_subscribe', params: ['newHeads'] }))
		expect(sent.filter((message) => 'result' in message)).toHaveLength(256)
		expect(sent.at(-1)).toEqual({
			jsonrpc: '2.0',
			id: 257,
			error: { code: -32005, message: 'Subscription limit exceeded: at most 256 per connection' },
		})
	} finally {
		await conn.close()
	}
	for (const maxSubscriptions of [-1, 1.5, Number.NaN, -Infinity, '2' as never])
		expect(() => createRpcConnection(engine, () => {}, { maxSubscriptions })).toThrow(RangeError)
	const none = createRpcConnection(engine, (json) => sent.push(JSON.parse(json)), { maxSubscriptions: 0 })
	await none.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['newHeads'] }))
	expect(sent.at(-1).error.code).toBe(-32005)
	await none.close()
})

it('drops a subscription whose filter the backend no longer knows instead of polling it forever', async () => {
	vi.useFakeTimers()
	const polls: unknown[] = []
	let filters = 0
	const engine = {
		rpc: async () => null,
		request: async ({ method, params }: EngineRequest) => {
			if (method === 'eth_newPendingTransactionFilter') return `0xf${++filters}`
			if (method !== 'eth_getFilterChanges') return true
			polls.push(params?.[0])
			if (params?.[0] === '0xf1') throw Object.assign(new Error('filter not found'), { code: -32000 })
			if (params?.[0] === '0xf2') throw new Error('backend busy')
			return ['0xab']
		},
	}
	const sent: any[] = []
	const conn = createRpcConnection(engine, (json) => sent.push(JSON.parse(json)))
	const call = (method: string, params: unknown[]) =>
		conn.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }))
	try {
		for (let i = 0; i < 3; i++) await call('eth_subscribe', ['newPendingTransactions'])
		await vi.advanceTimersByTimeAsync(50)
		expect(polls).toEqual(['0xf1', '0xf2', '0xf3'])
		// The missing filter is gone. A transient failure is retried, and the healthy filter delivers.
		await vi.advanceTimersByTimeAsync(50)
		expect(polls).toEqual(['0xf1', '0xf2', '0xf3', '0xf2', '0xf3'])
		expect(sent.filter((message) => message.method === 'eth_subscription')).toHaveLength(2)
		await call('eth_unsubscribe', ['0x1'])
		expect(sent.at(-1)).toEqual({ jsonrpc: '2.0', id: 1, result: false })
		// Dropping the last subscription stops the poll timer.
		await call('eth_unsubscribe', ['0x2'])
		await call('eth_unsubscribe', ['0x3'])
		await call('eth_subscribe', ['newPendingTransactions'])
		expect(vi.getTimerCount()).toBe(1)
		engine.request = async ({ method }: EngineRequest) => {
			if (method === 'eth_getFilterChanges') throw { shortMessage: 'Filter 0xf4 not found' }
			return true
		}
		await vi.advanceTimersByTimeAsync(50)
		expect(vi.getTimerCount()).toBe(0)
	} finally {
		await conn.close()
		vi.useRealTimers()
	}
})
