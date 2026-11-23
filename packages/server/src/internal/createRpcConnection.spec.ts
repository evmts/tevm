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
