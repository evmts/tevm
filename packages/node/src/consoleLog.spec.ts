import { encodeFunctionData, type Hex, parseAbi } from 'viem'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConsoleLogEvent } from './ConsoleLogEvent.js'
import { createZevmEngine } from './createZevmEngine.js'
import type { ZevmEngine } from './ZevmEngine.js'

// The native drain is implemented in ZEVM. Until every addon build ships it, these
// tests script the native boundary to pin TEVM's side of the wire contract exactly.
// `fake` is null for tests that use the real addon.
const state = vi.hoisted(() => ({
	fake: null as null | ((request: { method: string; params?: unknown[] }) => unknown),
	calls: [] as string[],
}))
vi.mock('node:module', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:module')>()
	return {
		...actual,
		createRequire: (url: string) => {
			const require = actual.createRequire(url)
			return (id: string) => {
				if (id !== '@evmts/zevm' || !state.fake) return require(id)
				return {
					NativeNode: class {
						rpc(json: string) {
							const request = JSON.parse(json)
							const requests = Array.isArray(request) ? request : [request]
							for (const item of requests) state.calls.push(item.method)
							const respond = (item: { id: number; method: string; params?: unknown[] }) => {
								try {
									return { jsonrpc: '2.0', id: item.id, result: state.fake!(item) }
								} catch (error) {
									return { jsonrpc: '2.0', id: item.id, error }
								}
							}
							return JSON.stringify(Array.isArray(request) ? request.map(respond) : respond(request))
						}
						close() {}
					},
				}
			}
		},
	}
})

const encode = (signature: string, args: readonly unknown[]) =>
	encodeFunctionData({ abi: parseAbi([`function ${signature}`] as readonly string[]) as any, args: args as any }) as Hex
const hello = encode('log(string,uint256)', ['hello %d', 42n])
const flag = encode('log(bool)', [true])
const methodNotFound = { code: -32601, message: 'Method not found' }

const nodes: ZevmEngine[] = []
const create = (options?: Parameters<typeof createZevmEngine>[0]) => {
	const node = createZevmEngine(options)
	nodes.push(node)
	return node
}
afterEach(async () => {
	await Promise.all(nodes.splice(0).map((node) => node.close()))
	state.fake = null
	state.calls = []
	vi.restoreAllMocks()
})

/** A native stand-in whose drain returns `pending` once and execution methods return `result`. */
const scripted = (pending: string[], result: unknown = '0x') => {
	let queue = pending
	state.fake = ({ method }) => {
		if (method === 'tevm_drainConsoleLogs') {
			const drained = queue
			queue = []
			return drained
		}
		if (method === 'eth_call' && result instanceof Error) throw { code: 3, message: result.message }
		return result
	}
}

describe('consoleLog option', () => {
	it('rejects a non-boolean, non-function value', () => {
		state.fake = () => null
		expect(() => createZevmEngine({ consoleLog: 'yes' as never })).toThrow(
			new TypeError('consoleLog must be a boolean or a function'),
		)
	})

	it('drains, decodes, emits and calls the handler after each execution method', async () => {
		for (const method of ['eth_call', 'eth_estimateGas', 'eth_sendTransaction', 'eth_sendRawTransaction']) {
			scripted([hello, '0xdeadbeef', flag])
			const handler = vi.fn()
			const node = create({ consoleLog: handler })
			const emitted: ConsoleLogEvent[] = []
			node.events.on('consoleLog', (event) => emitted.push(event))
			await node.request({ method, params: [] })
			expect(state.calls).toEqual([method, 'tevm_drainConsoleLogs'])
			expect(emitted).toEqual([
				{ message: 'hello 42', signature: 'log(string,uint256)', calldata: hello, args: ['hello %d', 42n] },
				{ message: 'true', signature: 'log(bool)', calldata: flag, args: [true] },
			])
			expect(handler.mock.calls).toEqual([
				['hello 42', { calldata: hello, args: ['hello %d', 42n] }],
				['true', { calldata: flag, args: [true] }],
			])
			await node.close()
			state.calls = []
		}
	})

	it('writes messages with console.log when set to true', async () => {
		scripted([hello])
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})
		const node = create({ consoleLog: true })
		await node.request({ method: 'eth_call', params: [] })
		expect(log).toHaveBeenCalledWith('hello 42')
	})

	it('does not drain for non-execution methods or when disabled', async () => {
		scripted([hello])
		const enabled = create({ consoleLog: true })
		await enabled.request({ method: 'eth_blockNumber' })
		expect(state.calls).toEqual(['eth_blockNumber'])
		state.calls = []
		const disabled = create()
		const emitted: unknown[] = []
		disabled.events.on('consoleLog', (event) => emitted.push(event))
		await disabled.request({ method: 'eth_call', params: [] })
		expect(state.calls).toEqual(['eth_call'])
		expect(emitted).toEqual([])
	})

	it('drains after a failed call so logs emitted before a revert are delivered', async () => {
		scripted([hello], new Error('execution reverted'))
		const handler = vi.fn()
		const node = create({ consoleLog: handler })
		await expect(node.request({ method: 'eth_call', params: [] })).rejects.toMatchObject({
			code: 3,
			message: expect.stringContaining('execution reverted'),
		})
		expect(handler).toHaveBeenCalledWith('hello 42', { calldata: hello, args: ['hello %d', 42n] })
	})

	it('drains after raw rpc execution requests, including batches', async () => {
		scripted([flag])
		const handler = vi.fn()
		const node = create({ consoleLog: handler })
		const response = await node.rpc(
			JSON.stringify([
				{ jsonrpc: '2.0', id: 1, method: 'eth_chainId' },
				{ jsonrpc: '2.0', id: 2, method: 'eth_call', params: [] },
			]),
		)
		expect(JSON.parse(response!)).toEqual([
			{ jsonrpc: '2.0', id: 1, result: '0x' },
			{ jsonrpc: '2.0', id: 2, result: '0x' },
		])
		expect(state.calls).toEqual(['eth_chainId', 'eth_call', 'tevm_drainConsoleLogs'])
		expect(handler).toHaveBeenCalledWith('true', { calldata: flag, args: [true] })
	})

	it('ignores -32601 from an engine without tevm_drainConsoleLogs and stops asking', async () => {
		state.fake = ({ method }) => {
			if (method === 'tevm_drainConsoleLogs') throw methodNotFound
			return '0x1'
		}
		const handler = vi.fn()
		const node = create({ consoleLog: handler })
		expect(await node.request({ method: 'eth_call', params: [] })).toBe('0x1')
		expect(await node.request({ method: 'eth_estimateGas', params: [] })).toBe('0x1')
		expect(state.calls).toEqual(['eth_call', 'tevm_drainConsoleLogs', 'eth_estimateGas'])
		expect(handler).not.toHaveBeenCalled()
	})

	it('surfaces other native drain failures', async () => {
		state.fake = ({ method }) => {
			if (method === 'tevm_drainConsoleLogs') throw { code: -32603, message: 'drain failed' }
			return '0x1'
		}
		const node = create({ consoleLog: true })
		await expect(node.request({ method: 'eth_call', params: [] })).rejects.toMatchObject({ code: -32603 })
	})

	it('keeps eth_call working on the real native addon', async () => {
		const handler = vi.fn()
		const node = create({ consoleLog: handler })
		const result = await node.request({
			method: 'eth_call',
			params: [{ to: '0x000000000000000000636f6e736f6c652e6c6f67', data: hello }, 'latest'],
		})
		expect(result).toBe('0x')
	})
})
