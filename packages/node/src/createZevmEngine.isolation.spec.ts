import { afterEach, describe, expect, it, vi } from 'vitest'
import { createZevmEngine } from './createZevmEngine.js'
import { NativeRpcError } from './NativeRpcError.js'
import type { JsonValue, ZevmBackend, ZevmEngine, ZevmEngineOptions } from './ZevmEngine.js'

type WireRequest = { jsonrpc: string; id: number; method: string; params?: JsonValue[] }
/** Returned by a handler to send `text` as the exact wire output. */
class Raw {
	constructor(readonly text: string | null) {}
}
/** Thrown by a handler to answer with a JSON-RPC error object. */
class Failure {
	constructor(readonly error: { code: number; message: string; data?: JsonValue }) {}
}
const reverted = new Failure({ code: 3, message: 'execution reverted', data: '0x08c379a0' })

const engines: ZevmEngine[] = []
afterEach(async () => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
	await Promise.all(engines.splice(0).map((engine) => engine.close().catch(() => {})))
})

/**
 * An in-memory chain behind the `ZevmBackend` seam. `override` answers first; returning
 * `undefined` falls through to the chain. `sent` records every wire request.
 */
function harness(
	override: (request: WireRequest) => unknown = () => undefined,
	options: Omit<ZevmEngineOptions, 'backend'> = {},
) {
	const chain = { head: 0, closes: 0, sent: [] as WireRequest[] }
	const backend: ZevmBackend = {
		async rpc(json) {
			const request: WireRequest = JSON.parse(json)
			chain.sent.push(request)
			let result: unknown
			try {
				result = await override(request)
				if (result instanceof Raw) return result.text
				if (result === undefined) {
					if (request.method === 'eth_chainId') result = '0x7a69'
					else if (request.method === 'eth_blockNumber') result = `0x${chain.head.toString(16)}`
					else if (request.method === 'evm_mine') result = `0x${(++chain.head).toString(16)}`
					else if (request.method === 'eth_getBlockByNumber') result = { number: request.params?.[0] ?? null }
					else result = 'ok'
				}
			} catch (error) {
				if (!(error instanceof Failure)) throw error
				return JSON.stringify({ jsonrpc: '2.0', id: request.id, error: error.error })
			}
			return JSON.stringify({ jsonrpc: '2.0', id: request.id, result })
		},
		close() {
			chain.closes++
		},
	}
	const engine = createZevmEngine({ ...options, backend })
	engines.push(engine)
	const errors: unknown[] = []
	engine.events.on('error', (error) => errors.push(error))
	const methods = () => chain.sent.map(({ method }) => method)
	return { engine, chain, errors, methods }
}

const boom = (label: string) => () => {
	throw new Error(label)
}
const messages = (errors: unknown[]) => errors.map((error) => (error as Error).message)

describe('post-dispatch observers never change an RPC outcome', () => {
	it('returns the committed result when request, response, block and error listeners throw', async () => {
		const { engine, errors } = harness()
		const blocks: unknown[] = []
		engine.events.on('block', (block) => blocks.push(block))
		await engine.request({ method: 'eth_blockNumber' })
		engine.events.on('request', boom('request listener'))
		engine.events.on('response', boom('response listener'))
		engine.events.on('block', boom('block listener'))
		engine.events.on('error', boom('error listener'))
		expect(await engine.request({ method: 'evm_mine' })).toBe('0x1')
		expect(await engine.rpc('{"jsonrpc":"2.0","id":"a","method":"evm_mine"}')).toBe(
			'{"jsonrpc":"2.0","id":"a","result":"0x2"}',
		)
		// Listeners registered before the throwing ones still ran, and so did the ones after.
		expect(blocks).toEqual([{ number: '0x1' }, { number: '0x2' }])
		expect(messages(errors)).toEqual(['request listener', 'block listener', 'response listener', 'block listener'])
	})

	it('keeps the revert error when a listener throws', async () => {
		const { engine } = harness(({ method }) => {
			if (method === 'eth_call') throw reverted
		})
		engine.events.on('request', boom('request listener'))
		engine.events.on('block', boom('block listener'))
		const error = await engine.request({ method: 'eth_call' }).catch((caught) => caught)
		expect(error).toBeInstanceOf(NativeRpcError)
		expect(error).toMatchObject({ code: 3, data: '0x08c379a0' })
	})

	it.each([
		['eth_blockNumber fails', 'eth_blockNumber', () => new Failure({ code: -32000, message: 'head unavailable' })],
		['eth_blockNumber is not a quantity', 'eth_blockNumber', () => 'latest'],
		['eth_blockNumber output is corrupt', 'eth_blockNumber', () => new Raw('wasm trap{')],
		['eth_getBlockByNumber fails', 'eth_getBlockByNumber', () => new Failure({ code: -32000, message: 'no block' })],
		['eth_getBlockByNumber throws', 'eth_getBlockByNumber', () => new Error('backend exploded')],
	] as const)('returns the result and reports an error event when %s', async (_name, failing, make) => {
		let broken = false
		const { engine, errors, chain } = harness(({ method }) => {
			if (!broken || method !== failing) return undefined
			const outcome = make()
			if (outcome instanceof Raw || typeof outcome === 'string') return outcome
			throw outcome
		})
		const blocks: unknown[] = []
		engine.events.on('block', (block) => blocks.push(block))
		await engine.request({ method: 'eth_blockNumber' })
		broken = true
		expect(await engine.request({ method: 'evm_mine' })).toBe('0x1')
		expect(await engine.rpc('{"jsonrpc":"2.0","id":5,"method":"evm_mine"}')).toBe(
			'{"jsonrpc":"2.0","id":5,"result":"0x2"}',
		)
		expect(errors).toHaveLength(2)
		expect(blocks).toEqual([])
		// The failed blocks are retried, in order, once the backend recovers.
		broken = false
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(blocks).toEqual([{ number: '0x1' }, { number: '0x2' }])
		expect(chain.closes).toBe(0)
	})

	it('keeps the revert error when the block fetch fails too', async () => {
		const { engine, errors } = harness(({ method }) => {
			if (method === 'eth_sendTransaction') throw reverted
			if (method === 'eth_blockNumber') throw new Failure({ code: -32000, message: 'head unavailable' })
		})
		engine.events.on('block', () => {})
		await expect(engine.request({ method: 'eth_sendTransaction' })).rejects.toMatchObject({ code: 3 })
		expect(errors.length).toBeGreaterThan(0)
		expect(errors.every((error) => (error as NativeRpcError).code === -32000)).toBe(true)
	})

	it('drops observer errors when there is no error listener', async () => {
		const { engine } = harness()
		engine.events.removeAllListeners('error')
		engine.events.on('response', boom('response listener'))
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
	})
})

describe('block polling', () => {
	it('keeps at most one timer poll queued while the backend is slow', async () => {
		vi.useFakeTimers()
		const gates: (() => void)[] = []
		const { engine, methods } = harness(({ method }) => {
			if (method !== 'eth_blockNumber') return undefined
			return new Promise<undefined>((resolve) => gates.push(() => resolve(undefined)))
		})
		await engine.ready()
		engine.events.on('block', () => {})
		// 20 timer ticks elapse while the baseline poll is still in flight.
		await vi.advanceTimersByTimeAsync(1000)
		expect(methods()).toEqual(['eth_blockNumber'])
		gates.shift()!()
		await vi.advanceTimersByTimeAsync(1000)
		// One coalesced poll followed the baseline. The other 39 ticks queued nothing.
		expect(methods()).toEqual(['eth_blockNumber', 'eth_blockNumber'])
		gates.shift()!()
		await vi.advanceTimersByTimeAsync(0)
		expect(methods()).toEqual(['eth_blockNumber', 'eth_blockNumber'])
		// Polling resumes on the next tick once the queue drains.
		await vi.advanceTimersByTimeAsync(50)
		expect(methods()).toEqual(['eth_blockNumber', 'eth_blockNumber', 'eth_blockNumber'])
		gates.shift()!()
	})

	it('stops at a null block without advancing past it, then resumes in order', async () => {
		let missing: string | undefined
		const { engine, chain, errors } = harness(({ method, params }) =>
			method === 'eth_getBlockByNumber' && params?.[0] === missing ? null : undefined,
		)
		const blocks: unknown[] = []
		engine.events.on('block', (block) => blocks.push(block))
		await engine.request({ method: 'eth_blockNumber' })
		missing = '0x2'
		chain.head = 3
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(blocks).toEqual([{ number: '0x1' }])
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(blocks).toEqual([{ number: '0x1' }])
		missing = undefined
		await engine.request({ method: 'eth_chainId' })
		expect(blocks).toEqual([{ number: '0x1' }, { number: '0x2' }, { number: '0x3' }])
		expect(errors).toEqual([])
	})

	it('replays a gap of 64 blocks one by one and jumps to the tip for a larger gap', async () => {
		const { engine, chain, methods } = harness()
		const blocks: { number: string }[] = []
		engine.events.on('block', (block) => blocks.push(block as { number: string }))
		await engine.request({ method: 'eth_blockNumber' })
		chain.head = 64
		await engine.request({ method: 'eth_chainId' })
		expect(blocks.map(({ number }) => Number(number))).toEqual(Array.from({ length: 64 }, (_, index) => index + 1))
		blocks.length = 0
		chain.sent.length = 0
		chain.head = 64 + 10_000
		await engine.request({ method: 'eth_chainId' })
		expect(blocks).toEqual([{ number: `0x${(10_064).toString(16)}` }])
		expect(methods()).toEqual(['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber'])
		// The baseline moved to the tip: the next block is emitted exactly once.
		blocks.length = 0
		await engine.request({ method: 'evm_mine' })
		expect(blocks).toEqual([{ number: `0x${(10_065).toString(16)}` }])
	})

	it('subscribes with a numeric browser timer that has no unref()', async () => {
		const cleared: unknown[] = []
		vi.stubGlobal('setInterval', () => 7)
		vi.stubGlobal('clearInterval', (timer: unknown) => cleared.push(timer))
		const { engine } = harness()
		expect(() => engine.events.on('block', () => {})).not.toThrow()
		expect(await engine.request({ method: 'evm_mine' })).toBe('0x1')
		await engine.close()
		expect(cleared).toContain(7)
	})
})

describe('observers cannot change a request, a result, or crash the process', () => {
	it('uses the submitted request for dispatch, response events and console draining', async () => {
		// The identity precompile returns the input bytes on the real EVM.
		const call = { to: '0x0000000000000000000000000000000000000004', data: '0xab' }
		const request = { method: 'eth_call', params: [call, 'latest'] }
		const expected = structuredClone(request)
		const native = createZevmEngine()
		const engine = createZevmEngine({ backend: native, consoleLog: true })
		engines.push(engine)
		const requests: unknown[] = []
		const responses: unknown[] = []
		const errors: unknown[] = []
		engine.events.on('error', (error) => errors.push(error))
		engine.events.on('request', (submitted) => {
			requests.push(submitted)
			queueMicrotask(() => {
				request.method = 'eth_blockNumber'
				call.data = '0xff'
			})
		})
		engine.events.on('response', (response) => {
			responses.push(response)
			// Closing here makes the subsequent drain observable even on addons without console capture.
			return native.close()
		})
		const pending = engine.request(request)
		request.method = 'eth_estimateGas'
		call.data = '0xcd'
		await expect(pending).resolves.toBe('0xab')
		expect(requests).toEqual([expected])
		expect(responses).toEqual([{ request: expected, result: '0xab' }])
		expect(errors).toEqual([expect.objectContaining({ constructor: Error, message: 'engine is closed' })])
	})

	it('dispatches the request as issued and returns the backend result when listeners mutate their payloads', async () => {
		const backendResult = { number: '0x1', transactions: ['0xaa'] }
		const { engine, chain, errors } = harness(({ method }) =>
			method === 'eth_getBlockByNumber' ? backendResult : undefined,
		)
		const seen: unknown[] = []
		engine.events.on('request', (emitted) => {
			seen.push(structuredClone(emitted))
			emitted.method = 'evm_mine'
			;(emitted.params as JsonValue[])[0] = 'tampered'
			;(emitted.params as JsonValue[]).push('extra')
		})
		engine.events.on('response', (response) => {
			seen.push(structuredClone(response))
			response.request.method = 'tampered'
			;(response.result as { number: string; transactions: string[] }).number = '0xdead'
			;(response.result as { number: string; transactions: string[] }).transactions.push('0xbb')
			response.result = null
		})
		const request = { method: 'eth_getBlockByNumber', params: ['0x1', false] }
		const result = await engine.request(request)
		expect(result).toEqual({ number: '0x1', transactions: ['0xaa'] })
		expect(request).toEqual({ method: 'eth_getBlockByNumber', params: ['0x1', false] })
		expect(chain.sent).toEqual([{ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['0x1', false] }])
		expect(seen).toEqual([request, { request, result: { number: '0x1', transactions: ['0xaa'] } }])
		expect(errors).toEqual([])
	})

	it('copies payloads through JSON where structuredClone is unavailable', async () => {
		const { engine, chain } = harness()
		vi.stubGlobal('structuredClone', undefined)
		const seen: unknown[] = []
		engine.events.on('request', (emitted) => {
			seen.push({ ...emitted })
			emitted.method = 'tampered'
		})
		engine.events.on('response', (response) => {
			seen.push(response.result)
			response.result = 'tampered'
		})
		const request = { method: 'eth_chainId' }
		expect(await engine.request(request)).toBe('0x7a69')
		expect(request).toEqual({ method: 'eth_chainId' })
		expect(chain.sent.map(({ method }) => method)).toEqual(['eth_chainId'])
		expect(seen).toEqual([{ method: 'eth_chainId' }, '0x7a69'])
	})

	it('reports async listener and consoleLog handler rejections as error events, never as unhandled rejections', async () => {
		const unhandled: unknown[] = []
		const onUnhandled = (reason: unknown) => unhandled.push(reason)
		process.on('unhandledRejection', onUnhandled)
		try {
			// console.log("hi") as Hardhat calldata: log(string).
			const calldata = `0x41304fac${'20'.padStart(64, '0')}${'2'.padStart(64, '0')}${'6869'.padEnd(64, '0')}`
			const { engine, errors } = harness(
				({ method }) => (method === 'tevm_drainConsoleLogs' ? [calldata] : undefined),
				{
					consoleLog: (async (message: string) => {
						throw new Error(`consoleLog handler: ${message}`)
					}) as never,
				},
			)
			engine.events.on('request', async () => {
				throw new Error('async request listener')
			})
			engine.events.on('response', async () => {
				throw new Error('async response listener')
			})
			engine.events.on('consoleLog', async () => {
				throw new Error('async consoleLog listener')
			})
			engine.events.on('error', async () => {
				throw new Error('async error listener')
			})
			expect(await engine.request({ method: 'eth_call' })).toBe('ok')
			await new Promise((resolve) => setTimeout(resolve, 0))
			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(messages(errors).sort()).toEqual([
				'async consoleLog listener',
				'async request listener',
				'async response listener',
				'consoleLog handler: hi',
			])
			expect(unhandled).toEqual([])
		} finally {
			process.off('unhandledRejection', onUnhandled)
		}
	})
})

describe('request validation', () => {
	it.each([null, undefined, 'eth_chainId', 42, {}, { method: 1 }, { method: null }, { params: [] }])(
		'rejects the invalid request %j before it reaches the queue, the backend or a listener',
		async (request) => {
			const { engine, methods } = harness()
			const seen: unknown[] = []
			engine.events.on('request', (emitted) => seen.push(emitted))
			const error = await engine.request(request as never).catch((caught) => caught)
			expect(error).toBeInstanceOf(TypeError)
			expect(error.message).toBe('invalid request: expected an object with a string `method`')
			expect(seen).toEqual([])
			expect(methods()).toEqual([])
			expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		},
	)

	it('writes jsonrpc and id itself, so caller fields cannot replace them', async () => {
		const { engine, chain } = harness()
		const request = { method: 'eth_chainId', params: [], id: 'caller', jsonrpc: '1.0' }
		expect(await engine.request(request as never)).toBe('0x7a69')
		expect(await engine.request({ method: 'eth_chainId', id: null } as never)).toBe('0x7a69')
		expect(chain.sent.map(({ jsonrpc, id }) => [jsonrpc, id])).toEqual([
			['2.0', 1],
			['2.0', 2],
		])
	})
})

describe('response validation', () => {
	it.each([
		['no jsonrpc member', (id: number) => JSON.stringify({ id, result: 1 }), /jsonrpc must be "2.0"/],
		['jsonrpc 1.0', (id: number) => JSON.stringify({ jsonrpc: '1.0', id, result: 1 }), /jsonrpc must be "2.0"/],
		['a stale id', (id: number) => JSON.stringify({ jsonrpc: '2.0', id: id - 1, result: 1 }), /response with id \d+/],
		['a string id', (id: number) => JSON.stringify({ jsonrpc: '2.0', id: String(id), result: 1 }), /response with id/],
		['no id', () => JSON.stringify({ jsonrpc: '2.0', result: 1 }), /response with id undefined/],
		['a null id on a result', () => JSON.stringify({ jsonrpc: '2.0', id: null, result: 1 }), /response with id null/],
		['neither result nor error', (id: number) => JSON.stringify({ jsonrpc: '2.0', id }), /invalid JSON-RPC response/],
		[
			'both result and error',
			(id: number) =>
				JSON.stringify({ jsonrpc: '2.0', id, result: 1, error: { code: 3, message: 'execution reverted' } }),
			/both `result` and `error`/,
		],
		[
			'a result and a null error',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, result: 1, error: null }),
			/both `result` and `error`/,
		],
		[
			'a null id on a response with both result and error',
			() => JSON.stringify({ jsonrpc: '2.0', id: null, result: 1, error: { code: 3, message: 'execution reverted' } }),
			/response with id null/,
		],
		['a null error', (id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: null }), /error must be an object/],
		[
			'a string error',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: 'execution reverted' }),
			/error must be an object/,
		],
		['an array error', (id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: [] }), /error must be an object/],
		[
			'an error without a code',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: { message: 'no code' } }),
			/integer `code`/,
		],
		[
			'a fractional error code',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: { code: 1.5, message: 'x' } }),
			/integer `code`/,
		],
		[
			'a string error code',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: { code: '3', message: 'x' } }),
			/integer `code`/,
		],
		[
			'an error without a message',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: { code: 3 } }),
			/string `message`/,
		],
		[
			'a non-string error message',
			(id: number) => JSON.stringify({ jsonrpc: '2.0', id, error: { code: 3, message: 7 } }),
			/string `message`/,
		],
	] as const)('rejects a response with %s as a transport fault', async (_name, reply, message) => {
		const { engine } = harness(({ method, id }) => (method === 'eth_call' ? new Raw(reply(id)) : undefined))
		const responses: unknown[] = []
		engine.events.on('response', (response) => responses.push(response))
		const error = await engine.request({ method: 'eth_call' }).catch((caught) => caught)
		expect(error).toBeInstanceOf(Error)
		expect(error).not.toBeInstanceOf(NativeRpcError)
		expect(error.message).toMatch(message)
		expect(responses).toEqual([])
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
	})

	it('accepts an error response with a null id as a structured RPC error', async () => {
		const { engine } = harness(
			() => new Raw('{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"Invalid Request"}}'),
		)
		const error = await engine.request({ method: 'eth_call' }).catch((caught) => caught)
		expect(error).toBeInstanceOf(NativeRpcError)
		expect(error.code).toBe(-32600)
	})
})

describe('chain ID configuration', () => {
	const untouched = () => {
		const rpc = vi.fn()
		const close = vi.fn()
		return { backend: { rpc, close } as unknown as ZevmBackend, rpc, close }
	}

	it('throws when chainId and common.id conflict, without touching the backend', () => {
		const { backend, rpc, close } = untouched()
		expect(() => createZevmEngine({ backend, chainId: 1, common: { id: 10 } })).toThrow(
			new TypeError('chainId (1) conflicts with common.id (10); pass one, or make them equal'),
		)
		expect(() => createZevmEngine({ backend, common: { id: -1 } })).toThrow(
			new TypeError('common.id must be an unsigned safe integer'),
		)
		expect(() => createZevmEngine({ backend, common: { id: 1.5 } })).toThrow(TypeError)
		expect(rpc).not.toHaveBeenCalled()
		expect(close).not.toHaveBeenCalled()
	})

	it.each([[{ chainId: 31337 }], [{ common: { id: 31337 } }], [{ chainId: 31337, common: { id: 31337 } }]])(
		'accepts %j when the injected backend reports the same chain ID',
		async (options) => {
			const { engine, methods } = harness(undefined, options)
			await engine.ready()
			expect(methods()).toEqual(['eth_chainId'])
			expect(await engine.request({ method: 'eth_blockNumber' })).toBe('0x0')
		},
	)

	it.each([[{ chainId: 1 }], [{ common: { id: 1 } }]])(
		'fails initialization for %j when the injected backend reports another chain ID',
		async (options) => {
			const { engine, chain, methods } = harness(undefined, { ...options, mining: { auto: false } })
			let closeEvents = 0
			engine.events.on('close', () => closeEvents++)
			await expect(engine.ready()).rejects.toThrow('backend reports chain ID "0x7a69" but chainId is 1')
			await expect(engine.request({ method: 'eth_blockNumber' })).rejects.toThrow('but chainId is 1')
			// The mismatch is found before any state-changing initialization call.
			expect(methods()).toEqual(['eth_chainId'])
			expect(chain.closes).toBe(1)
			expect(closeEvents).toBe(1)
		},
	)

	it('rejects a backend chain ID that is not a quantity and skips the check without eth_chainId', async () => {
		const malformed = harness(({ method }) => (method === 'eth_chainId' ? 31337 : undefined), { chainId: 31337 })
		await expect(malformed.engine.ready()).rejects.toThrow('backend reports chain ID 31337 but chainId is 31337')
		const legacy = harness(
			({ method }) => {
				if (method === 'eth_chainId') throw new Failure({ code: -32601, message: 'Method not found' })
			},
			{ chainId: 5 },
		)
		await legacy.engine.ready()
		expect(await legacy.engine.request({ method: 'eth_blockNumber' })).toBe('0x0')
		const failing = harness(
			({ method }) => {
				if (method === 'eth_chainId') throw new Failure({ code: -32603, message: 'internal' })
			},
			{ chainId: 5 },
		)
		await expect(failing.engine.ready()).rejects.toMatchObject({ code: -32603 })
		expect(failing.chain.closes).toBe(1)
	})

	it('sends no eth_chainId probe when neither chainId nor common is given', async () => {
		const { engine, methods } = harness()
		await engine.ready()
		expect(methods()).toEqual([])
	})
})

describe('shutdown', () => {
	it('closes the backend, emits close once and drops listeners when initialization fails', async () => {
		vi.useFakeTimers()
		const { engine, chain, methods } = harness(
			({ method }) => {
				if (method === 'evm_setAutomine') throw new Failure({ code: -32602, message: 'bad automine' })
			},
			{ mining: { auto: false, interval: 1 } },
		)
		const seen: string[] = []
		engine.events.on('close', () => seen.push('close'))
		engine.events.on('block', () => seen.push('block'))
		await expect(engine.ready()).rejects.toMatchObject({ code: -32602 })
		expect(seen).toEqual(['close'])
		expect(chain.closes).toBe(1)
		for (const event of ['close', 'block', 'error'] as const) expect(engine.events.listenerCount(event)).toBe(0)
		// A closed engine starts no poll timer and never reaches the backend again.
		const sent = methods().length
		engine.events.on('block', () => seen.push('block'))
		await vi.advanceTimersByTimeAsync(500)
		expect(vi.getTimerCount()).toBe(0)
		await expect(engine.rpc('{}')).rejects.toMatchObject({ code: -32602 })
		await engine.close()
		await engine.close()
		expect(methods().length).toBe(sent)
		expect(chain.closes).toBe(1)
		expect(seen).toEqual(['close'])
	})

	it('reports the initialization error even when closing the backend also fails', async () => {
		const backend: ZevmBackend = {
			rpc: () => {
				throw new Error('init exploded')
			},
			close: () => {
				throw new Error('close exploded')
			},
		}
		const engine = createZevmEngine({ backend, mining: { auto: true } })
		let closeEvents = 0
		engine.events.on('close', () => closeEvents++)
		await expect(engine.ready()).rejects.toThrow('init exploded')
		expect(closeEvents).toBe(1)
		await expect(engine.close()).resolves.toBeUndefined()
	})

	it('emits close to every listener even when one throws, then removes them', async () => {
		const { engine, chain } = harness()
		const seen: string[] = []
		engine.events.on('close', boom('close listener'))
		engine.events.on('close', () => seen.push('second'))
		await engine.close()
		expect(seen).toEqual(['second'])
		expect(chain.closes).toBe(1)
		expect(engine.events.listenerCount('close')).toBe(0)
	})
})

describe('native addon loading', () => {
	it('never looks up a Node built-in when a backend is injected', async () => {
		const lookup = vi.spyOn(process, 'getBuiltinModule')
		const { engine } = harness()
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(lookup).not.toHaveBeenCalled()
	})

	it.each([
		['process is missing', () => vi.stubGlobal('process', undefined)],
		['process has no getBuiltinModule', () => vi.stubGlobal('process', { env: {} })],
		[
			'node:module is unavailable',
			() => void vi.spyOn(process, 'getBuiltinModule').mockReturnValue(undefined as never),
		],
	])('throws an actionable error without a backend when %s', (_name, arrange) => {
		arrange()
		let thrown: unknown
		try {
			createZevmEngine()
		} catch (error) {
			thrown = error
		}
		vi.unstubAllGlobals()
		expect((thrown as Error).message).toMatch(/cannot load the native ZEVM addon/)
		expect((thrown as Error).message).toMatch(/pass a `backend` that implements `\{ rpc\(json\), close\(\) \}`/)
	})

	it('explains a missing optional @evmts/zevm install and keeps other load errors intact', () => {
		const missing = Object.assign(new Error("Cannot find module '@evmts/zevm'"), { code: 'MODULE_NOT_FOUND' })
		const broken = new Error('ZEVM addon does not expose the execution-node ABI; rebuild the native addon')
		const lookup = vi.spyOn(process, 'getBuiltinModule')
		const requireThrowing = (error: Error) =>
			lookup.mockReturnValue({
				createRequire: () => () => {
					throw error
				},
			} as never)
		requireThrowing(missing)
		let thrown: unknown
		try {
			createZevmEngine()
		} catch (error) {
			thrown = error
		}
		expect((thrown as Error).message).toMatch(/could not find the optional dependency `@evmts\/zevm`/)
		expect((thrown as Error).cause).toBe(missing)
		requireThrowing(broken)
		expect(() => createZevmEngine()).toThrow(broken)
		expect(lookup).toHaveBeenCalledWith('node:module')
	})
})
