import { fork } from 'node:child_process'
import { once } from 'node:events'
import { afterEach, describe, expect, it } from 'vitest'
import { createZevmEngine } from './createZevmEngine.js'
import { NativeRpcError } from './NativeRpcError.js'
import type { ZevmEngine } from './ZevmEngine.js'

const nodes: ZevmEngine[] = []
const create = (options?: Parameters<typeof createZevmEngine>[0]) => {
	const node = createZevmEngine(options)
	nodes.push(node)
	return node
}
afterEach(async () => {
	await Promise.all(nodes.splice(0).map((node) => node.close()))
})
const address = '0x0000000000000000000000000000000000000123'

describe('native ZEVM engine', () => {
	it('executes bytecode with isolated native state', async () => {
		const node = create({ chainId: 31337 })
		const other = create()
		await node.ready()
		expect(await node.request({ method: 'eth_chainId' })).toBe('0x7a69')
		await node.request({ method: 'anvil_setBalance', params: [address, '0x2a'] })
		expect(await node.request({ method: 'eth_getBalance', params: [address, 'latest'] })).toBe('0x2a')
		expect(await other.request({ method: 'eth_getBalance', params: [address, 'latest'] })).toBe('0x0')
		await node.request({ method: 'anvil_setCode', params: [address, '0x602a60005260206000f3'] })
		expect(await node.request({ method: 'eth_call', params: [{ to: address }, 'latest'] })).toBe(
			`0x${'0'.repeat(62)}2a`,
		)
	})
	it('returns exact JSON-RPC errors, batches and notification responses', async () => {
		const node = create()
		const response = await node.rpc('{"jsonrpc":"2.0","id":7,"method":"missing_method"}')
		expect(JSON.parse(response!)).toEqual({
			jsonrpc: '2.0',
			id: 7,
			error: { code: -32601, message: 'Method not found' },
		})
		expect(JSON.stringify(JSON.parse(response!))).toBe(response)
		expect(JSON.parse((await node.rpc('{'))!).error.code).toBe(-32700)
		expect(await node.rpc('{"jsonrpc":"2.0","method":"eth_chainId"}')).toBeNull()
		const batch = JSON.parse(
			(await node.rpc(
				'[{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"},{"jsonrpc":"2.0","id":2,"method":"eth_getTransactionByHash","params":["0x' +
					'00'.repeat(32) +
					'"]}]',
			))!,
		)
		expect(batch.map((entry: { result: unknown }) => entry.result)).toEqual(['0x0', null])
		await expect(node.request({ method: 'missing_method' })).rejects.toMatchObject({ code: -32601 })
		await expect(node.request({ method: 'missing_method' })).rejects.toBeInstanceOf(NativeRpcError)
	})
	it('serializes concurrent mutations, supports snapshots, and emits lifecycle events', async () => {
		const node = create()
		const seen: string[] = []
		node.events.on('request', (request) => seen.push(request.method))
		node.events.on('response', ({ request }) => seen.push(`${request.method}:done`))
		await Promise.all(
			['0x1', '0x2'].map((value) => node.request({ method: 'anvil_setBalance', params: [address, value] })),
		)
		expect(seen).toEqual(['anvil_setBalance', 'anvil_setBalance:done', 'anvil_setBalance', 'anvil_setBalance:done'])
		const snapshot = await node.request({ method: 'evm_snapshot' })
		await node.request({ method: 'anvil_setBalance', params: [address, '0x3'] })
		expect(await node.request({ method: 'evm_revert', params: [snapshot] })).toBe(true)
		expect(await node.request({ method: 'eth_getBalance', params: [address, 'latest'] })).toBe('0x2')
		let closed = 0
		node.events.on('close', () => closed++)
		await node.close()
		await node.close()
		expect(closed).toBe(1)
		await expect(node.request({ method: 'eth_chainId' })).rejects.toThrow('closed')
		await expect(node.rpc('{}')).rejects.toThrow('closed')
	})
	it('emits blocks mined by the native interval thread without an RPC request', async () => {
		const node = create({ mining: { auto: false, interval: 1 } })
		await node.ready()
		const event = once(node.events, 'block')
		expect((await event)[0]).toMatchObject({ number: '0x1' })
	})
	it('releases native state when initialization fails', async () => {
		const node = create({ fork: { url: 'invalid-url' } })
		await expect(node.ready()).rejects.toMatchObject({ code: -32602 })
		await expect(node.request({ method: 'eth_chainId' })).rejects.toMatchObject({ code: -32602 })
	})
	it.each([undefined, 1])('forks native upstream state at block %s', async (blockNumber) => {
		const child = fork(new URL('../fixtures/fork-server.cjs', import.meta.url), {
			stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
		})
		try {
			const [{ url }] = await once(child, 'message')
			const node = create({ fork: { url, ...(blockNumber === undefined ? {} : { blockNumber }) } })
			await node.ready()
			expect(await node.request({ method: 'eth_getBalance', params: [address, 'latest'] })).toBe('0x2a')
			expect(await node.request({ method: 'eth_call', params: [{ to: address }, 'latest'] })).toBe(
				`0x${'0'.repeat(62)}2a`,
			)
			await node.close()
		} finally {
			const exit = once(child, 'exit')
			child.kill('SIGTERM')
			await exit
		}
	})
	it('validates chain IDs and configures manual mining', async () => {
		expect(() => create({ chainId: -1 })).toThrow('unsigned safe integer')
		expect(() => create({ mining: { interval: -1 } })).toThrow('interval')
		expect(() => create({ fork: { url: 'http://localhost', blockNumber: Number.MAX_SAFE_INTEGER + 1 } })).toThrow(
			'blockNumber',
		)
		const node = create({ mining: { auto: false } })
		await node.ready()
		expect(await node.request({ method: 'anvil_getAutomine' })).toBe(false)
	})
})
