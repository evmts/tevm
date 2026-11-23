import { createRequire } from 'node:module'
import { afterEach, describe, expect, it } from 'vitest'
import { createZevmEngine } from './createZevmEngine.js'
import { NativeRpcError } from './NativeRpcError.js'
import type { ZevmBackend, ZevmEngine } from './ZevmEngine.js'

const engines: ZevmEngine[] = []
afterEach(async () => {
	await Promise.all(engines.splice(0).map((engine) => engine.close()))
})

/**
 * Create an in-memory WASM-style JSON-RPC backend (either sync or async)
 * with zero dependency on `@evmts/zevm` native bindings.
 */
function createWasmStyleBackend({ asyncMode = false, failMethod }: { asyncMode?: boolean; failMethod?: string } = {}) {
	let blockNumber = 0n
	let closed = false
	const calls: string[] = []

	const handleJson = (raw: string): string | null => {
		const parsed = JSON.parse(raw)
		if (Array.isArray(parsed)) {
			const replies = parsed.map((item) => handleSingle(item)).filter((item) => item !== null)
			return replies.length === 0 ? null : JSON.stringify(replies)
		}
		const reply = handleSingle(parsed)
		return reply === null ? null : JSON.stringify(reply)
	}

	const handleSingle = (req: { jsonrpc: string; id?: number; method: string; params?: unknown[] }) => {
		calls.push(req.method)
		// JSON-RPC 2.0 notifications omit `id` and expect no reply.
		if (req.id === undefined) return null
		if (failMethod && req.method === failMethod) {
			return {
				jsonrpc: '2.0',
				id: req.id,
				error: { code: -32000, message: `simulated failure on ${req.method}`, data: '0xdead' },
			}
		}
		switch (req.method) {
			case 'eth_chainId':
				return { jsonrpc: '2.0', id: req.id, result: '0x7a69' }
			case 'eth_blockNumber':
				return { jsonrpc: '2.0', id: req.id, result: `0x${blockNumber.toString(16)}` }
			case 'evm_mine':
				blockNumber += 1n
				return { jsonrpc: '2.0', id: req.id, result: '0x0' }
			case 'eth_getBlockByNumber':
				return { jsonrpc: '2.0', id: req.id, result: { number: req.params?.[0] ?? '0x0' } }
			case 'anvil_reset':
			case 'evm_setAutomine':
			case 'evm_setIntervalMining':
				return { jsonrpc: '2.0', id: req.id, result: null }
			default:
				return {
					jsonrpc: '2.0',
					id: req.id,
					error: { code: -32601, message: `method not found: ${req.method}` },
				}
		}
	}

	const backend: ZevmBackend = asyncMode
		? {
				rpc: async (json) => {
					await new Promise((resolve) => setTimeout(resolve, 2))
					return handleJson(json)
				},
				close: async () => {
					await new Promise((resolve) => setTimeout(resolve, 2))
					closed = true
				},
			}
		: {
				rpc: (json) => handleJson(json),
				close: () => {
					closed = true
				},
			}

	return {
		backend,
		calls,
		isClosed: () => closed,
	}
}

describe('pluggable ZEVM / WASM EVM backend', () => {
	it('runs a synchronous WASM-style backend without loading @evmts/zevm native bindings', async () => {
		const req = createRequire(import.meta.url)
		const zevmLoadedBefore = Object.keys(req.cache).some((id) => id.includes('@evmts/zevm') || id.includes('/zevm/'))

		const stub = createWasmStyleBackend({ asyncMode: false })
		const engine = createZevmEngine({
			backend: stub.backend,
			mining: { auto: false, interval: 0 },
		})
		engines.push(engine)

		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(await engine.request({ method: 'eth_blockNumber' })).toBe('0x0')
		expect(stub.calls).toEqual(['evm_setAutomine', 'evm_setIntervalMining', 'eth_chainId', 'eth_blockNumber'])

		// Notifications return null through raw rpc()
		expect(await engine.rpc(JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber' }))).toBeNull()

		// Unknown method throws structured NativeRpcError
		await expect(engine.request({ method: 'eth_unknownMethod' })).rejects.toMatchObject({
			name: 'NativeRpcError',
			code: -32601,
		})

		const zevmLoadedAfter = Object.keys(req.cache).some((id) => id.includes('@evmts/zevm') || id.includes('/zevm/'))
		expect(zevmLoadedAfter).toBe(zevmLoadedBefore)

		await engine.close()
		expect(stub.isClosed()).toBe(true)
		await expect(engine.request({ method: 'eth_blockNumber' })).rejects.toThrow('engine is closed')
	})

	it('runs an asynchronous WASM-style backend with strict serialization, events, and async close', async () => {
		const stub = createWasmStyleBackend({ asyncMode: true })
		const engine = createZevmEngine({
			backend: stub.backend,
			fork: { url: 'http://127.0.0.1:8545', blockNumber: 123 },
		})
		engines.push(engine)

		const seenEvents: string[] = []
		const minedBlocks: unknown[] = []
		engine.events.on('request', (req) => seenEvents.push(`req:${req.method}`))
		engine.events.on('response', ({ request }) => seenEvents.push(`res:${request.method}`))
		engine.events.on('block', (block) => minedBlocks.push(block))
		engine.events.on('close', () => seenEvents.push('close'))

		await engine.ready()

		// Fire concurrent requests and verify strict serialized ordering
		const [mineRes, blockRes] = await Promise.all([
			engine.request({ method: 'evm_mine' }),
			engine.request({ method: 'eth_blockNumber' }),
		])
		expect(mineRes).toBe('0x0')
		expect(blockRes).toBe('0x1')
		expect(minedBlocks).toEqual([{ number: '0x1' }])
		expect(seenEvents).toEqual(['req:evm_mine', 'res:evm_mine', 'req:eth_blockNumber', 'res:eth_blockNumber'])
		expect(stub.calls[0]).toBe('anvil_reset')

		await engine.close()
		expect(stub.isClosed()).toBe(true)
		expect(seenEvents.at(-1)).toBe('close')
	})

	it('closes the custom backend and surfaces NativeRpcError when startup configuration fails', async () => {
		const stub = createWasmStyleBackend({ asyncMode: true, failMethod: 'evm_setAutomine' })
		const engine = createZevmEngine({
			backend: stub.backend,
			mining: { auto: false },
		})
		engines.push(engine)

		await expect(engine.ready()).rejects.toBeInstanceOf(NativeRpcError)
		await expect(engine.request({ method: 'eth_blockNumber' })).rejects.toMatchObject({
			code: -32000,
			data: '0xdead',
		})
		expect(stub.isClosed()).toBe(true)
	})

	it('rejects malformed backend objects synchronously', () => {
		expect(() => createZevmEngine({ backend: /** @type {any} */ ({}) })).toThrow(TypeError)
	})
})
