import { beforeEach, describe, expect, it } from 'vitest'
import { createLoggingRequestProxy, useLogStore } from './logStore.js'

describe('useLogStore and createLoggingRequestProxy', () => {
	beforeEach(() => {
		useLogStore.getState().clearLogs()
	})

	it('appends formatted string and JSON object entries with monotonically increasing IDs', () => {
		const store = useLogStore.getState()
		store.addLog('request', 'eth_blockNumber')
		store.addLog('response', { blockNumber: '0x2a', ok: true })

		const { logs } = useLogStore.getState()
		expect(logs).toHaveLength(2)
		expect(logs[0]?.type).toBe('request')
		expect(logs[0]?.content).toBe('eth_blockNumber')
		expect(logs[1]?.type).toBe('response')
		expect(JSON.parse(logs[1]?.content ?? '{}')).toEqual({ blockNumber: '0x2a', ok: true })
		expect((logs[1]?.id ?? 0) > (logs[0]?.id ?? 0)).toBe(true)
	})

	it('falls back to String() when content contains circular references', () => {
		const cyclic: Record<string, unknown> = { label: 'loop' }
		cyclic['self'] = cyclic
		useLogStore.getState().addLog('error', cyclic)

		const { logs } = useLogStore.getState()
		expect(logs).toHaveLength(1)
		expect(logs[0]?.type).toBe('error')
		expect(logs[0]?.content).toBe('[object Object]')
	})

	it('caps retained log entries to prevent unbounded memory growth', () => {
		const { addLog } = useLogStore.getState()
		for (let i = 0; i < 120; i++) {
			addLog('request', `req-${i}`)
		}
		const { logs } = useLogStore.getState()
		expect(logs.length).toBeLessThanOrEqual(101)
		expect(logs[logs.length - 1]?.content).toBe('req-119')
	})

	it('clears all log entries via clearLogs()', () => {
		useLogStore.getState().addLog('request', 'eth_chainId')
		expect(useLogStore.getState().logs).toHaveLength(1)
		useLogStore.getState().clearLogs()
		expect(useLogStore.getState().logs).toEqual([])
	})

	it('logs request and response when verbose is true and returns exact result', async () => {
		const rpc = async (req: { method: string; params: string[] }) => ({ method: req.method, result: '0x1' })
		const proxied = createLoggingRequestProxy(rpc, true)

		const result = await proxied({ method: 'eth_chainId', params: [] })
		expect(result).toEqual({ method: 'eth_chainId', result: '0x1' })

		const { logs } = useLogStore.getState()
		expect(logs).toHaveLength(2)
		expect(logs[0]?.type).toBe('request')
		expect(logs[0]?.content).toContain('eth_chainId')
		expect(logs[1]?.type).toBe('response')
		expect(logs[1]?.content).toContain('0x1')
	})

	it('does not record logs when verbose is false', async () => {
		const rpc = async (value: number) => value * 2
		const proxied = createLoggingRequestProxy(rpc, false)

		expect(await proxied(21)).toBe(42)
		expect(useLogStore.getState().logs).toHaveLength(0)
	})

	it('records error entry and rethrows original error when proxied call fails in verbose mode', async () => {
		const failure = new Error('RPC upstream timeout')
		const rpc = async () => {
			throw failure
		}
		const proxied = createLoggingRequestProxy(rpc, true)

		await expect(proxied()).rejects.toThrow('RPC upstream timeout')
		const { logs } = useLogStore.getState()
		expect(logs).toHaveLength(2)
		expect(logs[0]?.type).toBe('request')
		expect(logs[1]?.type).toBe('error')
	})
})
