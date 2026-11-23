import { fork } from 'node:child_process'
import { once } from 'node:events'
import { type Hex, keccak256 } from 'viem'
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
	it('activates ModExp pricing and operand bounds at the mainnet Osaka timestamp', async () => {
		const word = (value: number) => value.toString(16).padStart(64, '0')
		for (const testCase of [
			// STATICCALL with exactly 499/500 forwarded gas; return its success word.
			{ code: '0x600060006000600060056101f3fa60005260206000f3', data: '0x', after: 0 },
			{ code: '0x600060006000600060056101f4fa60005260206000f3', data: '0x', after: 1 },
			// Copy calldata and forward 100,000 gas to ModExp. The empty modulus
			// must not bypass Osaka's declared base-length validation.
			{
				code: '0x366000600037600060003660006005620186a0fa60005260206000f3',
				data: `0x${word(1025)}${word(0)}${word(0)}`,
				after: 0,
			},
			{
				code: '0x366000600037600060003660006005620186a0fa60005260206000f3',
				data: `0x${word(1024)}${word(0)}${word(0)}`,
				after: 1,
			},
		]) {
			const node = create({ chainId: 1 })
			await node.request({ method: 'anvil_setCode', params: [address, testCase.code] })
			for (const [timestamp, expected] of [
				[1764798550, 1],
				[1764798551, testCase.after],
			] as const) {
				await node.request({ method: 'evm_setNextBlockTimestamp', params: [`0x${timestamp.toString(16)}`] })
				const response = await node.rpc(
					JSON.stringify({
						jsonrpc: '2.0',
						id: 7883,
						method: 'eth_call',
						params: [{ to: address, data: testCase.data, gas: '0xf4240' }, 'pending'],
					}),
				)
				expect(JSON.parse(response!)).toEqual({ jsonrpc: '2.0', id: 7883, result: `0x${word(expected)}` })
				expect(JSON.stringify(JSON.parse(response!))).toBe(response)
			}
		}
	})
	it('activates EIP-7939 CLZ at the mainnet Osaka timestamp', async () => {
		const node = create({ chainId: 1 })
		// Local genesis is deterministic (timestamp zero), independent of wall time.
		expect(await node.request({ method: 'eth_getBlockByNumber', params: ['latest', false] })).toMatchObject({
			number: '0x0',
			timestamp: '0x0',
		})
		// PUSH1 0; CLZ; MSTORE(0); RETURN(0, 32). EIP-7939 requires CLZ(0) = 256.
		await node.request({ method: 'anvil_setCode', params: [address, '0x60001e60005260206000f3'] })
		const call = JSON.stringify({
			jsonrpc: '2.0',
			id: 7939,
			method: 'eth_call',
			params: [{ to: address }, 'pending'],
		})
		await node.request({ method: 'evm_setNextBlockTimestamp', params: [`0x${(1764798551 - 1).toString(16)}`] })
		expect(JSON.parse((await node.rpc(call))!)).toEqual({
			jsonrpc: '2.0',
			id: 7939,
			error: { code: 3, message: 'execution reverted', data: '0x' },
		})
		await node.request({ method: 'evm_setNextBlockTimestamp', params: [`0x${(1764798551).toString(16)}`] })
		const response = await node.rpc(call)
		expect(JSON.parse(response!)).toEqual({
			jsonrpc: '2.0',
			id: 7939,
			result: `0x${'0'.repeat(61)}100`,
		})
		expect(JSON.stringify(JSON.parse(response!))).toBe(response)
	})
	it('enforces the Osaka transaction gas cap on the native JSON-RPC wire', async () => {
		const node = create({ chainId: 1, mining: { auto: false } })
		const accounts = await node.request({ method: 'eth_accounts' })
		if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') throw new Error('Missing managed account')
		const from = accounts[0]
		const transaction = { from, to: address, gas: '0x1000001' }
		await node.request({ method: 'evm_setNextBlockTimestamp', params: [`0x${(1764798551 - 1).toString(16)}`] })
		const signed = await node.request({ method: 'eth_signTransaction', params: [transaction] })
		expect(typeof signed).toBe('string')
		// Exercise both admission paths before activation with isolated pools.
		// Signing alone would not prove that submission retains Prague behavior.
		for (const method of ['eth_sendTransaction', 'eth_sendRawTransaction']) {
			const historical = create({ chainId: 1, mining: { auto: false } })
			await historical.request({ method: 'evm_setNextBlockTimestamp', params: [`0x${(1764798551 - 1).toString(16)}`] })
			const response = await historical.rpc(
				JSON.stringify({
					jsonrpc: '2.0',
					id: 7825,
					method,
					params: method === 'eth_sendRawTransaction' ? [signed] : [transaction],
				}),
			)
			expect(JSON.parse(response!)).toEqual({ jsonrpc: '2.0', id: 7825, result: keccak256(signed as Hex) })
			expect(JSON.stringify(JSON.parse(response!))).toBe(response)
			expect(
				await historical.request({ method: 'eth_getTransactionByHash', params: [keccak256(signed as Hex)] }),
			).toMatchObject({
				gas: '0x1000001',
			})
		}
		const balance = await node.request({ method: 'eth_getBalance', params: [from, 'latest'] })
		const nonce = await node.request({ method: 'eth_getTransactionCount', params: [from, 'latest'] })
		await node.request({ method: 'evm_setNextBlockTimestamp', params: [`0x${(1764798551).toString(16)}`] })
		for (const method of ['eth_sendTransaction', 'eth_signTransaction', 'eth_sendRawTransaction']) {
			const response = await node.rpc(
				JSON.stringify({
					jsonrpc: '2.0',
					id: 7825,
					method,
					params: method === 'eth_sendRawTransaction' ? [signed] : [transaction],
				}),
			)
			expect(JSON.parse(response!)).toEqual({
				jsonrpc: '2.0',
				id: 7825,
				error: { code: -32000, message: 'transaction gas limit exceeds Osaka cap (16777216)' },
			})
			expect(JSON.stringify(JSON.parse(response!))).toBe(response)
		}
		expect(await node.request({ method: 'eth_getBalance', params: [from, 'latest'] })).toBe(balance)
		expect(await node.request({ method: 'eth_getTransactionCount', params: [from, 'latest'] })).toBe(nonce)
	})
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
	it('handles idle fast-path calls, listener-gated events, and idempotent close', async () => {
		const node = create()
		await node.ready()
		// Subsequent ready() calls resolve immediately without re-initializing.
		await node.ready()
		expect(await node.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(JSON.parse(await node.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber' })))).toEqual({
			jsonrpc: '2.0',
			id: 1,
			result: '0x0',
		})

		// Mining without listeners attached succeeds without emitting; attaching a listener receives events.
		await node.request({ method: 'evm_mine' })
		const blocks: Array<{ number: string }> = []
		const onBlock = (block: { number: string }) => blocks.push(block)
		node.events.on('block', onBlock)
		await node.request({ method: 'evm_mine' })
		expect(blocks).toHaveLength(1)
		expect(blocks[0]?.number).toBe('0x2')
		node.events.off('block', onBlock)
		await node.request({ method: 'evm_mine' })
		expect(blocks).toHaveLength(1)

		// close() is idempotent and subsequent requests reject cleanly.
		await node.close()
		await node.close()
		await expect(node.request({ method: 'eth_chainId' })).rejects.toThrow('engine is closed')
	})
})
