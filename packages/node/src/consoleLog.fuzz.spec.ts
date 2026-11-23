import { encodeAbiParameters, type Hex, toFunctionSelector } from 'viem'
import { describe, expect, it } from 'vitest'
import type { ConsoleLogEvent } from './ConsoleLogEvent.js'
import { createZevmEngine } from './createZevmEngine.js'
import type { JsonValue } from './ZevmEngine.js'

const execution = ['eth_call', 'eth_estimateGas', 'eth_sendTransaction', 'eth_sendRawTransaction']
const reads = ['eth_blockNumber', 'eth_chainId']
const drain = 'tevm_drainConsoleLogs'
const reverted = { code: 3, message: 'execution reverted', data: '0x' }
const unsupported = { code: -32601, message: 'Method not found' }
const seed = Number(process.env['FUZZ_SEED'] ?? 0xc011501)
const runs = Number(process.env['FUZZ_RUNS'] ?? 256)
if (!Number.isSafeInteger(seed) || !Number.isSafeInteger(runs) || runs < 1)
	throw new Error('Invalid FUZZ_SEED/FUZZ_RUNS')

type Draw = (limit: number) => number
const pick = <T>(draw: Draw, values: readonly T[]) => values[draw(values.length)]!
type Entry = { wire: JsonValue; expected?: ConsoleLogEvent }
type Call = { method: string; captures: Entry[]; revert: boolean; notify: boolean }
type Step = {
	api: 'request' | 'raw' | 'batch'
	calls: Call[]
	spelling: 'method' | 'key' | 'plain'
	decoy: boolean
	invalidDrain?: null | boolean | string
}

function capture(draw: Draw): Entry {
	const n = BigInt(draw(2 ** 32)) - 2n ** 31n
	const bytes = `0x${Buffer.from(Array.from({ length: draw(65) }, () => draw(256))).toString('hex')}` as Hex
	let signature: string
	let payload: Hex
	let args: (string | bigint)[]
	let message: string
	switch (draw(4)) {
		case 0:
			signature = 'log(int256)'
			payload = encodeAbiParameters([{ type: 'int256' }], [n])
			args = [n]
			message = String(n)
			break
		case 1:
			signature = 'log(bytes)'
			payload = encodeAbiParameters([{ type: 'bytes' }], [bytes])
			args = [bytes]
			message = bytes
			break
		case 2:
			signature = 'log(string,int256)'
			payload = encodeAbiParameters([{ type: 'string' }, { type: 'int256' }], ['🧪 %i', n])
			args = ['🧪 %i', n]
			message = `🧪 ${n}`
			break
		default:
			return {
				wire: pick<JsonValue>(draw, [
					null,
					false,
					Number(n),
					[],
					{ data: bytes },
					`0xz${bytes.slice(2)}`,
					'0x41304fac',
					'0xdeadbeef',
				]),
			}
	}
	const calldata: Hex = `${toFunctionSelector(signature)}${payload.slice(2)}`
	return { wire: calldata, expected: { calldata, args, signature, message } }
}

function step(draw: Draw, forceExecution: boolean): Step {
	const api = pick(draw, ['request', 'raw', 'batch'] as const)
	const calls = Array.from({ length: api === 'batch' ? 1 + draw(5) : 1 }, (_, index) => {
		const method = pick(draw, forceExecution && index === 0 ? execution : [...execution, ...reads])
		const executes = execution.includes(method)
		const captures = executes ? Array.from({ length: draw(6) }, () => capture(draw)) : []
		if (captures.length && draw(5) === 0) captures.push(captures[0]!)
		return { method, captures, revert: executes && draw(3) === 0, notify: api !== 'request' && draw(6) === 0 }
	})
	return {
		api,
		calls,
		spelling: pick(draw, ['method', 'key', 'plain']),
		decoy: Boolean(draw(2)),
		...(draw(8) === 0 && { invalidDrain: pick(draw, [null, false, 'bad drain result']) }),
	}
}

function response(call: Call) {
	if (call.revert) return { error: reverted }
	switch (call.method) {
		case 'eth_chainId':
			return { result: '0x7a69' }
		case 'eth_blockNumber':
			return { result: '0x0' }
		case 'eth_estimateGas':
			return { result: '0x5208' }
		case 'eth_call':
			return { result: '0x' }
		default:
			return { result: `0x${'42'.repeat(32)}` }
	}
}

const executesCode = (step: Step) => step.calls.some(({ method }) => execution.includes(method))

async function checkSequence(steps: Step[], unsupportedAt: number) {
	let drains = 0
	let current: Call[] = []
	let invalidDrain: Step['invalidDrain']
	const pending: JsonValue[] = []
	const trace: string[] = []
	const events: ConsoleLogEvent[] = []
	const callbacks: unknown[] = []
	const engine = createZevmEngine({
		backend: {
			async rpc(json) {
				await Promise.resolve()
				const input = JSON.parse(json)
				if (input?.method === drain) {
					trace.push(drain)
					drains++
					const entries = pending.splice(0)
					const result = invalidDrain === undefined ? entries : invalidDrain
					const reply = drains === unsupportedAt ? { error: unsupported } : { result }
					return JSON.stringify({ jsonrpc: '2.0', id: input.id, ...reply })
				}
				const batch = Array.isArray(input)
				const replies = (batch ? input : [input]).flatMap((item: { id?: number; method: string }, index: number) => {
					trace.push(item.method)
					const call = current[index]!
					pending.push(...call.captures.map(({ wire }) => wire))
					return item.id === undefined ? [] : [{ jsonrpc: '2.0', id: item.id, ...response(call) }]
				})
				return replies.length ? JSON.stringify(batch ? replies : replies[0]) : null
			},
			close() {},
		},
		consoleLog: (message, detail) => callbacks.push([message, detail]),
	})
	engine.events.on('consoleLog', (event: ConsoleLogEvent) => events.push(event))
	let expectedDrains = 0
	try {
		for (const op of steps) {
			trace.length = 0
			events.length = 0
			callbacks.length = 0
			current = op.calls
			invalidDrain = op.invalidDrain
			const expectedTrace = current.map(({ method }) => method)
			const shouldDrain = executesCode(op) && expectedDrains < unsupportedAt
			if (shouldDrain) {
				expectedTrace.push(drain)
				expectedDrains++
			}
			const expectedEvents =
				shouldDrain && op.invalidDrain === undefined && expectedDrains < unsupportedAt
					? current.flatMap(({ captures }) => captures.flatMap(({ expected }) => (expected ? [expected] : [])))
					: []
			if (op.api === 'request') {
				const call = current[0]!
				const result = engine.request({ method: call.method })
				if (call.revert)
					await expect(result).rejects.toMatchObject({
						code: reverted.code,
						data: reverted.data,
						shortMessage: reverted.message,
					})
				else expect(await result).toEqual(response(call).result)
			} else {
				const requests = current.map(({ method, notify }, index) => ({
					jsonrpc: '2.0',
					...(!notify && { id: index }),
					method,
					...(op.decoy && { params: [{ method: 'eth_call' }] }),
				}))
				let raw = JSON.stringify(op.api === 'batch' ? requests : requests[0], null, op.decoy ? 2 : 0)
				if (op.spelling === 'method') raw = raw.replaceAll('"eth_', '"\\u0065th_')
				if (op.spelling === 'key') raw = raw.replaceAll('"method"', '"\\u006dethod"')
				const replies = current.flatMap((call, id) => (call.notify ? [] : [{ jsonrpc: '2.0', id, ...response(call) }]))
				const wire = replies.length ? JSON.stringify(op.api === 'batch' ? replies : replies[0]) : null
				expect(await engine.rpc(raw)).toBe(wire)
			}
			expect(trace).toEqual(expectedTrace)
			expect(events).toEqual(expectedEvents)
			expect(callbacks).toEqual(expectedEvents.map(({ message, args, calldata }) => [message, { args, calldata }]))
		}
	} finally {
		await engine.close()
	}
}

async function scenarios(legacy: boolean) {
	for (let index = 0; index < runs; index++) {
		let state = (seed + Math.imul(index, 0x9e3779b9)) >>> 0
		const draw: Draw = (limit) => {
			state = (Math.imul(1664525, state) + 1013904223) >>> 0
			return Math.floor((state / 2 ** 32) * limit)
		}
		const length = 4 + draw(9)
		let steps = Array.from({ length }, (_, i) => step(draw, i === 0 || i === length - 1))
		// Always exercise at least one execution *after* the first method-not-found reply.
		const unsupportedAt = legacy ? 1 + draw(steps.filter(executesCode).length - 1) : Infinity
		try {
			await checkSequence(steps, unsupportedAt)
		} catch (original) {
			let cause = original
			// Drop commands while the model still fails. Each replay gets a fresh engine and queue.
			for (let i = steps.length - 1; i >= 0; i--) {
				const shorter = steps.filter((_, j) => j !== i)
				try {
					await checkSequence(shorter, unsupportedAt)
				} catch (error) {
					steps = shorter
					cause = error
				}
			}
			const methods = steps.map((s) => [s.api, s.spelling, s.calls.map((call) => call.method)])
			throw new Error(
				`FUZZ_SEED=${seed}, case ${index}, unsupportedAt=${unsupportedAt}, shrunk steps=${JSON.stringify(methods)}`,
				{ cause },
			)
		}
	}
}

describe('console log drain state machine (asynchronous WASM-style backend)', () => {
	it.each([
		['eth_call', 'key', false],
		['eth_call', 'method', false],
		['eth_chainId', 'plain', true],
	] as const)('classifies raw %s with %s spelling and nested method %s', async (method, spelling, decoy) => {
		await checkSequence(
			[{ api: 'raw', calls: [{ method, captures: [], revert: false, notify: false }], spelling, decoy }],
			Infinity,
		)
	})

	it('preserves the backend parse error for invalid raw JSON containing an execution method', async () => {
		const raw = '{"method":"eth_call"'
		const reply = '{"jsonrpc":"2.0","id":null,"error":{"code":-32700,"message":"Parse error"}}'
		const received: string[] = []
		const engine = createZevmEngine({
			consoleLog: true,
			backend: {
				rpc(json) {
					received.push(json)
					return reply
				},
				close() {},
			},
		})
		try {
			expect(await engine.rpc(raw)).toBe(reply)
			expect(received).toEqual([raw])
		} finally {
			await engine.close()
		}
	})

	it('matches the ordered drain, event, callback and RPC model after every operation', () => scenarios(false))
	it('permanently stops draining after the first -32601 and preserves later RPC behavior', () => scenarios(true))
})
