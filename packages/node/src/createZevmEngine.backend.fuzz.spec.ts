/**
 * Property and stateful concurrency fuzz tests for `createZevmEngine` over a pluggable `ZevmBackend`.
 *
 * `fast-check` is not a dependency of `@tevm/node`, so this file carries a small seeded generator,
 * a parallel batch runner and a delta-debugging shrinker. Every scenario is plain data derived from
 * one 32-bit seed. A failure prints the seed, the run index and the shrunk scenario.
 *
 * Environment overrides:
 * - `FUZZ_SEED`: base seed (default `0xc0ffee`).
 * - `FUZZ_RUNS`: scenarios per property (default 300; the synchronous option property runs 3x).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createZevmEngine } from './createZevmEngine.js'
import { NativeRpcError } from './NativeRpcError.js'
import type { JsonValue, ZevmBackend, ZevmEngine, ZevmEngineOptions } from './ZevmEngine.js'

const BASE_SEED = Number(process.env['FUZZ_SEED'] ?? 0xc0ffee) >>> 0
const RUNS = Math.max(1, Number(process.env['FUZZ_RUNS'] ?? 300) | 0)
const TEST_TIMEOUT = 120_000

// ---------------------------------------------------------------------------------------------
// Process-wide leak monitors: live `setInterval` handles and unhandled promise rejections.
// ---------------------------------------------------------------------------------------------

const liveIntervals = new Set<unknown>()
let intervalCreations = 0
const unhandled: unknown[] = []
const realSetInterval = globalThis.setInterval
const realClearInterval = globalThis.clearInterval
const onUnhandled = (reason: unknown) => {
	unhandled.push(reason)
}

beforeAll(() => {
	globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
		const handle = realSetInterval(...args)
		intervalCreations++
		liveIntervals.add(handle)
		return handle
	}) as typeof setInterval
	globalThis.clearInterval = ((handle: Parameters<typeof clearInterval>[0]) => {
		liveIntervals.delete(handle)
		realClearInterval(handle)
	}) as typeof clearInterval
	process.on('unhandledRejection', onUnhandled)
})

afterAll(() => {
	globalThis.setInterval = realSetInterval
	globalThis.clearInterval = realClearInterval
	process.off('unhandledRejection', onUnhandled)
})

/** Report and reset leaked intervals and unhandled rejections. */
function takeGlobalViolation(): string | undefined {
	const problems: string[] = []
	if (liveIntervals.size > 0) problems.push(`${liveIntervals.size} interval timer(s) still live after close`)
	if (unhandled.length > 0)
		problems.push(`unhandled rejection(s): ${unhandled.map((reason) => String(reason)).join(' | ')}`)
	for (const handle of liveIntervals) realClearInterval(handle as Parameters<typeof clearInterval>[0])
	liveIntervals.clear()
	unhandled.length = 0
	return problems.length === 0 ? undefined : problems.join('; ')
}

// ---------------------------------------------------------------------------------------------
// Seeded generator, scheduling primitives, runner and shrinker.
// ---------------------------------------------------------------------------------------------

type Rng = {
	next: () => number
	int: (bound: number) => number
	bool: (p?: number) => boolean
	pick: <T>(xs: readonly T[]) => T
}

/** mulberry32. */
function makeRng(seed: number): Rng {
	let a = seed >>> 0
	const next = () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
	const int = (bound: number) => Math.floor(next() * bound)
	return { next, int, bool: (p = 0.5) => next() < p, pick: (xs) => xs[int(xs.length)] as (typeof xs)[number] }
}

/** Delay codes: negative values select a scheduling primitive, others are `setTimeout` milliseconds. */
const SYNC = -3
const MICRO = -2
const IMMEDIATE = -1

const wait = (delay: number): Promise<void> =>
	delay <= MICRO
		? Promise.resolve()
		: delay === IMMEDIATE
			? new Promise((resolve) => setImmediate(resolve))
			: new Promise((resolve) => setTimeout(resolve, delay))

/** Let pending microtasks, immediates and `unhandledRejection` events run. */
const settle = async () => {
	await wait(IMMEDIATE)
	await wait(IMMEDIATE)
}

/**
 * Backend latency plan, cycled per `rpc()` call: synchronous, fast mixed primitives,
 * uniform 0..15ms, or strictly decreasing delays so an unserialized queue would answer in reverse.
 */
function genDelays(r: Rng): number[] {
	const length = 1 + r.int(8)
	switch (r.int(5)) {
		case 0:
			return []
		case 1:
			return Array.from({ length }, () => r.pick([SYNC, MICRO, IMMEDIATE, 0, 1]))
		case 2:
			return Array.from({ length }, () => r.int(16))
		case 3:
			return Array.from({ length: 8 }, (_, i) => 15 - i * 2)
		default:
			return Array.from({ length }, () => r.pick([SYNC, MICRO, MICRO, IMMEDIATE, 0, 0, 2, 15]))
	}
}

const genGap = (r: Rng) => r.pick([SYNC, SYNC, SYNC, MICRO, IMMEDIATE, 0, 1, 3])

const show = (value: unknown) =>
	JSON.stringify(value, (_key, v) =>
		typeof v === 'bigint'
			? `${v}n`
			: typeof v === 'number' && !Number.isFinite(v)
				? String(v)
				: typeof v === 'function'
					? '[function]'
					: v,
	)

/** Delta-debugging candidates: drop chunks from every array field, then make the backend synchronous. */
function* shrinkCandidates<S extends Record<string, unknown>>(scenario: S): Generator<S> {
	for (const key of Object.keys(scenario)) {
		const value = scenario[key]
		if (!Array.isArray(value) || value.length === 0) continue
		for (let size = Math.ceil(value.length / 2); size >= 1; size = size === 1 ? 0 : Math.ceil(size / 2)) {
			for (let start = 0; start + size <= value.length; start += size) {
				yield { ...scenario, [key]: [...value.slice(0, start), ...value.slice(start + size)] }
			}
		}
	}
	const delays = scenario['delays']
	if (Array.isArray(delays) && delays.some((delay) => delay !== SYNC)) {
		yield { ...scenario, delays: delays.map(() => SYNC) }
	}
}

const hashName = (name: string) => {
	let hash = 2166136261
	for (let i = 0; i < name.length; i++) hash = Math.imul(hash ^ name.charCodeAt(i), 16777619)
	return hash >>> 0
}

/**
 * Run `runs` seeded scenarios in parallel batches. Per-scenario assertions run inside `prop`;
 * interval and unhandled-rejection leaks are checked after each batch, then re-attributed and
 * shrunk by replaying scenarios one at a time.
 */
async function fuzz<S extends Record<string, unknown>>(
	name: string,
	{
		runs = RUNS,
		batch = 60,
		gen,
		prop,
	}: { runs?: number; batch?: number; gen: (r: Rng) => S; prop: (s: S) => Promise<void> },
): Promise<void> {
	const isolated = async (scenario: S): Promise<unknown> => {
		let error: unknown
		try {
			await prop(scenario)
		} catch (caught) {
			error = caught ?? new Error('property threw a nullish value')
		}
		await settle()
		const violation = takeGlobalViolation()
		return error ?? (violation === undefined ? undefined : new Error(violation))
	}
	for (let start = 0; start < runs; start += batch) {
		const seeds = Array.from(
			{ length: Math.min(batch, runs - start) },
			(_, i) => (BASE_SEED ^ hashName(name) ^ Math.imul(start + i + 1, 0x9e3779b1)) >>> 0,
		)
		const scenarios = seeds.map((seed) => gen(makeRng(seed)))
		const errors = await Promise.all(
			scenarios.map((scenario) =>
				prop(scenario).then(
					() => undefined,
					(error: unknown) => error ?? new Error('property threw a nullish value'),
				),
			),
		)
		await settle()
		const violation = takeGlobalViolation()
		let index = errors.findIndex((error) => error !== undefined)
		let error = errors[index]
		if (index < 0 && violation === undefined) continue
		if (index < 0) {
			for (let i = 0; i < scenarios.length && index < 0; i++) {
				error = await isolated(scenarios[i] as S)
				if (error !== undefined) index = i
			}
			if (index < 0) {
				throw new Error(
					`[${name}] ${violation}; not reproducible in isolation. FUZZ_SEED=${BASE_SEED} runs ${start}..${start + seeds.length - 1}`,
				)
			}
		}
		let failing = scenarios[index] as S
		let budget = 120
		shrinking: while (budget > 0) {
			for (const candidate of shrinkCandidates(failing)) {
				if (budget-- <= 0) break shrinking
				const candidateError = await isolated(candidate)
				if (candidateError !== undefined) {
					failing = candidate
					error = candidateError
					continue shrinking
				}
			}
			break
		}
		const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
		throw new Error(
			`[${name}] property failed. FUZZ_SEED=${BASE_SEED} run=${start + index} seed=${seeds[index]}\nshrunk scenario: ${show(failing)}\n${detail}`,
		)
	}
}

type Outcome<T> = { ok: true; value: T } | { ok: false; error: unknown }
const outcome = <T>(promise: Promise<T>): Promise<Outcome<T>> =>
	promise.then(
		(value) => ({ ok: true as const, value }),
		(error: unknown) => ({ ok: false as const, error }),
	)
/** Resolve to the rejection reason; fail when the promise resolves. */
const rejection = (promise: Promise<unknown>): Promise<any> =>
	promise.then(
		(value) => {
			throw new Error(`expected a rejection, resolved with ${show(value)}`)
		},
		(error: unknown) => error,
	)
const throwFirstFailure = (outcomes: Outcome<unknown>[]) => {
	const failed = outcomes.find((result) => !result.ok)
	if (failed && !failed.ok) throw failed.error
}

// ---------------------------------------------------------------------------------------------
// Instrumented WASM-style backend.
// ---------------------------------------------------------------------------------------------

type FailMode = 'error' | 'syncThrow' | 'asyncReject' | 'garbage' | 'truncated' | 'null'
type BackendConfig = {
	delays?: number[]
	closeDelay?: number
	closeThrows?: boolean
	fail?: { method: string; mode: FailMode }
}
const FAIL_ERROR = { code: -32099, message: 'init failed', data: '0xdead' }
const FAIL_OUTPUT: Record<Exclude<FailMode, 'syncThrow' | 'asyncReject'>, string | null> = {
	error: JSON.stringify({ jsonrpc: '2.0', id: 1, error: FAIL_ERROR }),
	garbage: 'wasm trap: unreachable{',
	truncated: '{"jsonrpc":"2.0","id":1,"resu',
	null: null,
}

/**
 * In-memory JSON-RPC backend that records concurrency, ordering and lifecycle facts.
 * `fuzz_echo` returns `params[0]`, `fuzz_error` returns it as the error member, `fuzz_throw`
 * throws, and a top-level `fuzz_raw` request returns `params[0]` verbatim as the wire output.
 */
function createFuzzBackend(config: BackendConfig = {}) {
	const delays = config.delays ?? []
	const closeDelay = config.closeDelay ?? SYNC
	const state = {
		head: 0n,
		inFlight: 0,
		maxInFlight: 0,
		rpcStarts: 0,
		closeCalls: 0,
		rpcAfterClose: 0,
		closeWhileInFlight: 0,
		failNextGetBlock: false,
		/** Exact strings passed to `rpc()`, in call order. */
		received: [] as string[],
		/** Top-level method of every non-batch `rpc()` call. */
		methods: [] as string[],
		/** Caller tokens (`t<index>`) in execution order. */
		order: [] as string[],
		thrown: new Error('backend init exploded'),
		closeError: new Error('backend close exploded'),
	}
	const single = (req: any): unknown => {
		if (req === null || typeof req !== 'object' || Array.isArray(req) || typeof req.method !== 'string') {
			return { jsonrpc: '2.0', id: req?.id ?? null, error: { code: -32600, message: 'Invalid Request' } }
		}
		const params: unknown[] = Array.isArray(req.params) ? req.params : []
		const first = params[0] as any
		const token = typeof first === 'string' ? first : first?.data
		if (typeof token === 'string' && /^t\d+$/.test(token)) state.order.push(token)
		let reply: { result: unknown } | { error: unknown }
		switch (req.method) {
			case 'eth_blockNumber':
				reply = { result: `0x${state.head.toString(16)}` }
				break
			case 'evm_mine':
				state.head += 1n
				reply = { result: '0x0' }
				break
			case 'eth_getBlockByNumber':
				if (state.failNextGetBlock) {
					state.failNextGetBlock = false
					reply = { error: { code: -32000, message: 'block fetch failed' } }
				} else reply = { result: { number: first ?? '0x0' } }
				break
			case 'eth_call':
			case 'fuzz_echo':
				reply = { result: first ?? null }
				break
			case 'fuzz_error':
				reply = { error: first ?? null }
				break
			case 'fuzz_throw':
				throw new Error(`backend exploded: ${String(first)}`)
			case 'tevm_drainConsoleLogs':
				reply = { result: [] }
				break
			case 'anvil_reset':
			case 'evm_setAutomine':
			case 'evm_setIntervalMining':
				reply = { result: null }
				break
			default:
				reply = { error: { code: -32601, message: `method not found: ${req.method}` } }
		}
		// JSON-RPC 2.0 notifications omit `id` and expect no reply.
		if (!('id' in req)) return null
		return { jsonrpc: '2.0', id: req.id, ...reply }
	}
	const handle = (json: string): string | null => {
		let parsed: any
		try {
			parsed = JSON.parse(json)
		} catch {
			return JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
		}
		if (parsed !== null && typeof parsed === 'object' && parsed.method === 'fuzz_raw') {
			const raw = Array.isArray(parsed.params) ? parsed.params[0] : null
			return typeof raw === 'string' ? raw : null
		}
		if (Array.isArray(parsed)) {
			if (parsed.length === 0) return JSON.stringify(single(undefined))
			const replies = parsed.map(single).filter((reply) => reply !== null)
			return replies.length === 0 ? null : JSON.stringify(replies)
		}
		const reply = single(parsed)
		return reply === null ? null : JSON.stringify(reply)
	}
	const backend: ZevmBackend = {
		rpc: (json) => {
			if (state.closeCalls > 0) state.rpcAfterClose++
			state.received.push(json)
			let method: unknown
			try {
				method = JSON.parse(json)?.method
			} catch {}
			if (typeof method === 'string') state.methods.push(method)
			const failing = config.fail !== undefined && method === config.fail.method ? config.fail.mode : undefined
			if (failing === 'syncThrow') throw state.thrown
			const delay = delays.length === 0 ? SYNC : (delays[state.rpcStarts % delays.length] as number)
			state.rpcStarts++
			state.inFlight++
			state.maxInFlight = Math.max(state.maxInFlight, state.inFlight)
			const finish = () => {
				state.inFlight--
				if (failing === 'asyncReject') throw state.thrown
				if (failing !== undefined) return FAIL_OUTPUT[failing]
				return handle(json)
			}
			if (delay === SYNC && failing !== 'asyncReject') return finish()
			return wait(delay).then(finish)
		},
		close: () => {
			state.closeCalls++
			if (state.inFlight > 0) state.closeWhileInFlight++
			const done = () => {
				if (config.closeThrows) throw state.closeError
			}
			if (closeDelay === SYNC) return done()
			return wait(closeDelay).then(done)
		},
	}
	return { backend, state }
}

const range = (fromExclusive: bigint, toInclusive: bigint) => {
	const numbers: bigint[] = []
	for (let number = fromExclusive + 1n; number <= toInclusive; number++) numbers.push(number)
	return numbers
}
const assertConsecutive = (numbers: bigint[]) => {
	for (let i = 1; i < numbers.length; i++) {
		if (numbers[i] !== (numbers[i - 1] as bigint) + 1n) {
			throw new Error(`block events skipped or duplicated: ${show(numbers)}`)
		}
	}
}
const blockNumberOf = (block: unknown) => BigInt((block as { number: string }).number)

// ---------------------------------------------------------------------------------------------
// Random JSON values and wire strings.
// ---------------------------------------------------------------------------------------------

const STRINGS = [
	'',
	'a',
	'0x',
	'0xdeadbeef',
	'null',
	'"quoted"',
	'line\nbreak',
	'tab\t',
	'\u0000',
	' ',
	'ünïcödé',
	'😀',
	'\\',
	'{"x":1}',
	'x'.repeat(200),
]
const KEYS = ['a', 'b', '', 'result', 'error', 'id', 'jsonrpc', 'constructor', 'toString', 'k y']

function genJson(r: Rng, depth = 0): JsonValue {
	switch (r.int(depth > 2 ? 5 : 7)) {
		case 0:
			return null
		case 1:
			return r.bool()
		case 2:
			return r.int(2001) - 1000
		case 3:
			return r.pick([
				0,
				1.5,
				-2.25,
				1e21,
				1e-7,
				Number.MAX_SAFE_INTEGER,
				Number.MIN_SAFE_INTEGER,
				2 ** 53,
				1.7976931348623157e308,
			])
		case 4:
			return r.pick(STRINGS)
		case 5:
			return Array.from({ length: r.int(4) }, () => genJson(r, depth + 1))
		default: {
			const object: { [key: string]: JsonValue } = {}
			for (let i = r.int(4); i > 0; i--) object[r.pick(KEYS)] = genJson(r, depth + 1)
			return object
		}
	}
}

const WIRE_METHODS = [
	'fuzz_echo',
	'fuzz_echo',
	'eth_blockNumber',
	'evm_mine',
	'eth_getBlockByNumber',
	'eth_chainId',
	'fuzz_error',
	'tevm_unknown',
]
const WIRE_LITERALS = [
	'',
	' ',
	'null',
	'42',
	'"x"',
	'[]',
	'{}',
	'[null]',
	'[1,2,3]',
	'{"method":1}',
	'{"jsonrpc":"2.0","id":1}',
	'{"id":1e999,"method":"fuzz_echo"}',
	'undefined',
	'NaN',
	'{"id":1,"id":2,"method":"fuzz_echo","params":[1]}',
	'\u0000',
	'{"method":"fuzz_echo","params":"not-an-array","id":0}',
]
const GARBAGE_ALPHABET = [
	'{',
	'}',
	'[',
	']',
	'"',
	',',
	':',
	'\\',
	'n',
	'u',
	'l',
	't',
	'r',
	'e',
	'0',
	'9',
	'-',
	'.',
	'E',
	' ',
	'\n',
	'\u0000',
	'￿',
	'😀',
]
const genGarbage = (r: Rng) => Array.from({ length: r.int(24) }, () => r.pick(GARBAGE_ALPHABET)).join('')

function genWireCall(r: Rng): { [key: string]: JsonValue } {
	const call: { [key: string]: JsonValue } = { jsonrpc: '2.0', method: r.pick(WIRE_METHODS), params: [genJson(r)] }
	// One in five calls is a notification.
	if (!r.bool(0.2)) call['id'] = r.pick<JsonValue>([r.int(1000), -1, 1.5, 'string-id', '', null])
	return call
}

function genWire(r: Rng): string {
	switch (r.int(12)) {
		case 0:
		case 1:
		case 2:
			return JSON.stringify(genWireCall(r))
		case 3:
			return JSON.stringify({ jsonrpc: '2.0', method: r.pick(WIRE_METHODS), params: [genJson(r)] })
		case 4:
			return JSON.stringify(Array.from({ length: r.int(5) }, () => (r.bool(0.15) ? genJson(r) : genWireCall(r))))
		case 5: {
			const valid = JSON.stringify(genWireCall(r))
			return valid.slice(0, r.int(valid.length))
		}
		case 6:
			return genGarbage(r)
		case 7:
			return r.pick(WIRE_LITERALS)
		case 8:
			return JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'fuzz_raw',
				params: [r.bool(0.2) ? null : r.bool() ? genGarbage(r) : r.pick(WIRE_LITERALS)],
			})
		case 9:
			return JSON.stringify({ jsonrpc: '2.0', id: r.int(10), method: 'fuzz_throw', params: [r.pick(STRINGS)] })
		case 10:
			return JSON.stringify({ jsonrpc: '2.0', id: r.int(10), method: 'fuzz_error', params: [genJson(r)] })
		default:
			return ` \n\t${JSON.stringify(genWireCall(r), null, r.int(3))}\n `
	}
}

// ---------------------------------------------------------------------------------------------
// Property 1: serialized FIFO queue under arbitrary async backend jitter.
// ---------------------------------------------------------------------------------------------

type FifoKind = 'req' | 'call' | 'err' | 'throw' | 'rpc' | 'batch' | 'note'
type FifoScenario = {
	delays: number[]
	init: boolean
	block: boolean
	consoleLog: boolean
	ops: { k: FifoKind; gap: number }[]
}

const genFifo = (r: Rng): FifoScenario => ({
	delays: genDelays(r),
	init: r.bool(),
	block: r.bool(0.3),
	consoleLog: r.bool(0.3),
	ops: Array.from({ length: 1 + r.int(14) }, () => ({
		k: r.pick<FifoKind>(['req', 'req', 'call', 'err', 'throw', 'rpc', 'rpc', 'batch', 'note']),
		gap: genGap(r),
	})),
})

async function fireFifo(engine: ZevmEngine, kind: FifoKind, index: number): Promise<void> {
	const token = `t${index}`
	switch (kind) {
		case 'req':
		case 'call':
			expect(await engine.request({ method: kind === 'call' ? 'eth_call' : 'fuzz_echo', params: [token] })).toBe(token)
			return
		case 'err': {
			const code = -32000 - index
			const error = await rejection(
				engine.request({ method: 'fuzz_error', params: [{ code, message: `boom ${token}`, data: token }] }),
			)
			expect(error).toBeInstanceOf(NativeRpcError)
			expect(error.code).toBe(code)
			expect(error.data).toBe(token)
			return
		}
		case 'throw': {
			const error = await rejection(engine.request({ method: 'fuzz_throw', params: [token] }))
			expect(error).not.toBeInstanceOf(NativeRpcError)
			expect(error.message).toBe(`backend exploded: ${token}`)
			return
		}
		case 'rpc':
			expect(
				await engine.rpc(JSON.stringify({ jsonrpc: '2.0', id: token, method: 'fuzz_echo', params: [token] })),
			).toBe(JSON.stringify({ jsonrpc: '2.0', id: token, result: token }))
			return
		case 'batch':
			expect(
				await engine.rpc(
					JSON.stringify(
						['a', 'b'].map((suffix) => ({ jsonrpc: '2.0', id: token + suffix, method: 'fuzz_echo', params: [token] })),
					),
				),
			).toBe(JSON.stringify(['a', 'b'].map((suffix) => ({ jsonrpc: '2.0', id: token + suffix, result: token }))))
			return
		case 'note':
			expect(await engine.rpc(JSON.stringify({ jsonrpc: '2.0', method: 'fuzz_echo', params: [token] }))).toBeNull()
			return
	}
}

async function propFifo(s: FifoScenario): Promise<void> {
	const { backend, state } = createFuzzBackend({ delays: s.delays })
	const engine = createZevmEngine({
		backend,
		...(s.init ? { mining: { auto: true, interval: 0 } } : {}),
		...(s.consoleLog ? { consoleLog: () => {} } : {}),
	})
	try {
		if (s.block) engine.events.on('block', () => {})
		const expectedOrder: string[] = []
		const checks: Promise<Outcome<void>>[] = []
		for (const [index, op] of s.ops.entries()) {
			checks.push(outcome(fireFifo(engine, op.k, index)))
			expectedOrder.push(...(op.k === 'batch' ? [`t${index}`, `t${index}`] : [`t${index}`]))
			if (op.gap !== SYNC) await wait(op.gap)
		}
		throwFirstFailure(await Promise.all(checks))
		// Zero overlapping backend calls, strict FIFO execution, strictly increasing engine request ids.
		expect(state.maxInFlight).toBeLessThanOrEqual(1)
		expect(state.order).toEqual(expectedOrder)
		const ids = state.received.map((json) => JSON.parse(json)?.id).filter((id) => typeof id === 'number')
		for (let i = 1; i < ids.length; i++) expect(ids[i]).toBeGreaterThan(ids[i - 1])
	} finally {
		await engine.close()
	}
	expect(state.inFlight).toBe(0)
	expect(state.closeCalls).toBe(1)
	expect(state.rpcAfterClose).toBe(0)
}

// ---------------------------------------------------------------------------------------------
// Property 2: mid-flight close() and teardown safety.
// ---------------------------------------------------------------------------------------------

type CloseKind = 'req' | 'rpc' | 'mine' | 'bg' | 'on' | 'off' | 'close'
type CloseScenario = { delays: number[]; closeDelay: number; init: number; ops: { k: CloseKind; gap: number }[] }

const genClose = (r: Rng): CloseScenario => ({
	delays: genDelays(r),
	closeDelay: r.pick([SYNC, MICRO, IMMEDIATE, 0, 3, 10]),
	init: r.int(3),
	ops: Array.from({ length: 1 + r.int(14) }, () => ({
		k: r.pick<CloseKind>(['req', 'req', 'rpc', 'rpc', 'mine', 'mine', 'bg', 'on', 'on', 'off', 'close']),
		gap: genGap(r),
	})),
})

const INIT_OPTIONS: ZevmEngineOptions[] = [
	{},
	{ mining: { auto: false } },
	{ fork: { url: 'http://fuzz.invalid', blockNumber: 7 }, mining: { auto: true, interval: 0 } },
]

async function propClose(s: CloseScenario): Promise<void> {
	const { backend, state } = createFuzzBackend({ delays: s.delays, closeDelay: s.closeDelay })
	// Operations start in the same tick as creation, so close() can land before ready() resolves.
	const engine = createZevmEngine({ backend, ...INIT_OPTIONS[s.init % INIT_OPTIONS.length] })
	let closeEvents = 0
	engine.events.on('close', () => closeEvents++)
	const epochs: { headAtSubscribe: bigint; numbers: bigint[] }[] = []
	let listener: ((block: unknown) => void) | undefined
	let closeInvoked = false
	let subscribedAfterClose = false
	const calls: { afterClose: boolean; expected: unknown; result: Promise<Outcome<unknown>> }[] = []
	const closes: Promise<Outcome<void>>[] = []
	for (const [index, op] of s.ops.entries()) {
		const token = `t${index}`
		switch (op.k) {
			case 'req':
				calls.push({
					afterClose: closeInvoked,
					expected: token,
					result: outcome(engine.request({ method: 'fuzz_echo', params: [token] })),
				})
				break
			case 'mine':
				calls.push({
					afterClose: closeInvoked,
					expected: '0x0',
					result: outcome(engine.request({ method: 'evm_mine' })),
				})
				break
			case 'rpc':
				calls.push({
					afterClose: closeInvoked,
					expected: JSON.stringify({ jsonrpc: '2.0', id: token, result: token }),
					result: outcome(
						engine.rpc(JSON.stringify({ jsonrpc: '2.0', id: token, method: 'fuzz_echo', params: [token] })),
					),
				})
				break
			case 'bg':
				// Native interval mining advances the chain without a request.
				state.head += 1n
				break
			case 'on':
				if (!listener) {
					const epoch = { headAtSubscribe: state.head, numbers: [] as bigint[] }
					epochs.push(epoch)
					listener = (block) => epoch.numbers.push(blockNumberOf(block))
					engine.events.on('block', listener)
					subscribedAfterClose ||= closeInvoked
				}
				break
			case 'off':
				if (listener) engine.events.off('block', listener)
				listener = undefined
				break
			case 'close':
				closeInvoked = true
				closes.push(outcome(engine.close()))
				break
		}
		if (op.gap !== SYNC) await wait(op.gap)
	}
	closes.push(outcome(engine.close()))
	const results = await Promise.all(calls.map((call) => call.result))
	throwFirstFailure(await Promise.all(closes))

	// The backend is closed exactly once, never during or before an rpc() call.
	expect(state.closeCalls).toBe(1)
	expect(state.closeWhileInFlight).toBe(0)
	expect(state.rpcAfterClose).toBe(0)
	expect(state.maxInFlight).toBeLessThanOrEqual(1)
	expect(state.inFlight).toBe(0)
	expect(closeEvents).toBe(1)

	// Every call either returns its own response or rejects with 'engine is closed';
	// successes form a prefix in firing order, and nothing fired after close() succeeds.
	let rejected = false
	for (const [index, result] of results.entries()) {
		const call = calls[index] as (typeof calls)[number]
		if (result.ok) {
			if (rejected || call.afterClose) throw new Error(`call ${index} succeeded after the engine closed`)
			expect(result.value).toEqual(call.expected)
		} else {
			rejected = true
			expect(result.error).toBeInstanceOf(Error)
			expect((result.error as Error).message).toBe('engine is closed')
		}
	}

	// Block events are consecutive and never replay blocks mined before the subscription.
	for (const epoch of epochs) {
		assertConsecutive(epoch.numbers)
		if (epoch.numbers.length > 0 && (epoch.numbers[0] as bigint) <= epoch.headAtSubscribe) {
			throw new Error(`replayed block ${epoch.numbers[0]} mined before subscription at head ${epoch.headAtSubscribe}`)
		}
	}

	// A closed engine stays closed: no listeners, no new timers, clean rejections, idempotent close().
	if (!subscribedAfterClose) expect(engine.events.listenerCount('block')).toBe(0)
	expect(engine.events.listenerCount('close')).toBe(0)
	const intervalsBefore = intervalCreations
	engine.events.on('block', () => {})
	expect(intervalCreations).toBe(intervalsBefore)
	expect((await rejection(engine.request({ method: 'fuzz_echo' }))).message).toBe('engine is closed')
	expect((await rejection(engine.rpc('{}'))).message).toBe('engine is closed')
	await engine.close()
	expect(state.closeCalls).toBe(1)
	expect(state.rpcAfterClose).toBe(0)
	expect(closeEvents).toBe(1)
}

// ---------------------------------------------------------------------------------------------
// Property 3: initialization failure cleanup.
// ---------------------------------------------------------------------------------------------

type InitFailKind = 'req' | 'rpc' | 'on' | 'off' | 'close'
type InitFailScenario = {
	delays: number[]
	closeDelay: number
	closeThrows: boolean
	fork: boolean
	auto: boolean
	interval: boolean
	failIndex: number
	mode: FailMode
	ops: { k: InitFailKind; gap: number }[]
}

const genInitFail = (r: Rng): InitFailScenario => ({
	delays: genDelays(r),
	closeDelay: r.pick([SYNC, MICRO, IMMEDIATE, 0, 3, 10]),
	closeThrows: r.bool(0.25),
	fork: r.bool(),
	auto: r.bool(),
	interval: r.bool(),
	failIndex: r.int(3),
	mode: r.pick<FailMode>(['error', 'syncThrow', 'asyncReject', 'garbage', 'truncated', 'null']),
	ops: Array.from({ length: r.int(10) }, () => ({
		k: r.pick<InitFailKind>(['req', 'rpc', 'on', 'on', 'off', 'close']),
		gap: r.pick([SYNC, SYNC, MICRO, IMMEDIATE, 0, 1, 3, 8]),
	})),
})

async function propInitFail(s: InitFailScenario): Promise<void> {
	const enabled = [
		s.fork && 'anvil_reset',
		s.auto && 'evm_setAutomine',
		(s.interval || !(s.fork || s.auto)) && 'evm_setIntervalMining',
	].filter((method): method is string => typeof method === 'string')
	const failAt = s.failIndex % enabled.length
	const { backend, state } = createFuzzBackend({
		delays: s.delays,
		closeDelay: s.closeDelay,
		closeThrows: s.closeThrows,
		fail: { method: enabled[failAt] as string, mode: s.mode },
	})
	const engine = createZevmEngine({
		backend,
		...(s.fork ? { fork: { url: 'http://fuzz.invalid' } } : {}),
		mining: {
			...(s.auto ? { auto: false } : {}),
			...(enabled.includes('evm_setIntervalMining') ? { interval: 2 } : {}),
		},
	})
	let closeEvents = 0
	engine.events.on('close', () => closeEvents++)
	const listener = () => {
		throw new Error('block event emitted by an engine that failed to initialize')
	}
	const calls: Promise<Outcome<unknown>>[] = []
	const closes: Promise<Outcome<void>>[] = []
	// ready() is deliberately not observed until the end: the engine alone must keep the failure handled.
	for (const op of s.ops) {
		if (op.k === 'req') calls.push(outcome(engine.request({ method: 'fuzz_echo', params: ['x'] })))
		else if (op.k === 'rpc') calls.push(outcome(engine.rpc('{"jsonrpc":"2.0","id":1,"method":"fuzz_echo"}')))
		else if (op.k === 'on') engine.events.on('block', listener)
		else if (op.k === 'off') engine.events.off('block', listener)
		else closes.push(outcome(engine.close()))
		if (op.gap !== SYNC) await wait(op.gap)
	}
	const results = await Promise.all(calls)
	throwFirstFailure(await Promise.all(closes))

	const readyError = await rejection(engine.ready())
	expect(readyError).toBeInstanceOf(Error)
	if (s.mode === 'error') {
		expect(readyError).toBeInstanceOf(NativeRpcError)
		expect(readyError.code).toBe(FAIL_ERROR.code)
		expect(readyError.data).toBe(FAIL_ERROR.data)
	} else if (s.mode === 'syncThrow' || s.mode === 'asyncReject') {
		expect(readyError).toBe(state.thrown)
	} else {
		expect(readyError).not.toBe(state.closeError)
	}
	// Requests fail with the initialization error and never reach the backend.
	for (const result of results) {
		if (result.ok) throw new Error(`request succeeded on an engine that failed to initialize: ${show(result.value)}`)
		expect(result.error).toBe(readyError)
	}
	expect(await rejection(engine.request({ method: 'fuzz_echo' }))).toBe(readyError)
	expect(await rejection(engine.rpc('{}'))).toBe(readyError)
	// Initialization stops at the failing step, the backend closes exactly once, and close() stays clean.
	await engine.close()
	await engine.close()
	expect(state.methods).toEqual(enabled.slice(0, failAt + 1))
	expect(state.closeCalls).toBe(1)
	expect(state.rpcAfterClose).toBe(0)
	expect(state.closeWhileInFlight).toBe(0)
	expect(closeEvents).toBeLessThanOrEqual(1)
	const intervalsBefore = intervalCreations
	engine.events.on('block', listener)
	expect(intervalCreations).toBe(intervalsBefore)
}

// ---------------------------------------------------------------------------------------------
// Property 4a: raw rpc() is a byte-exact, order-preserving pipe for arbitrary wire strings.
// ---------------------------------------------------------------------------------------------

type WireScenario = { delays: number[]; ops: string[] }
const genWireScenario = (r: Rng): WireScenario => ({
	delays: r.bool(0.7) ? [] : Array.from({ length: 4 }, () => r.pick([SYNC, MICRO, IMMEDIATE, 0, 1])),
	ops: Array.from({ length: 1 + r.int(16) }, () => genWire(r)),
})

async function propWire(s: WireScenario): Promise<void> {
	const { backend, state } = createFuzzBackend({ delays: s.delays })
	// The reference backend is fed the same strings in order, with no engine in between.
	const reference = createFuzzBackend()
	const engine = createZevmEngine({ backend })
	try {
		const results = await Promise.all(s.ops.map((json) => outcome(engine.rpc(json))))
		expect(state.received).toEqual(s.ops)
		for (const [index, json] of s.ops.entries()) {
			const result = results[index] as Outcome<string | null>
			let expected: Outcome<string | null>
			try {
				expected = { ok: true, value: reference.backend.rpc(json) as string | null }
			} catch (error) {
				expected = { ok: false, error }
			}
			if (expected.ok) {
				if (!result.ok) throw result.error
				expect(result.value).toBe(expected.value)
			} else {
				if (result.ok) throw new Error(`rpc(${show(json)}) resolved although the backend threw`)
				expect((result.error as Error).message).toBe((expected.error as Error).message)
			}
		}
		expect(state.maxInFlight).toBeLessThanOrEqual(1)
		// Malformed traffic never poisons the queue.
		expect(await engine.request({ method: 'fuzz_echo', params: ['alive'] })).toBe('alive')
	} finally {
		await engine.close()
	}
	expect(state.closeCalls).toBe(1)
}

// ---------------------------------------------------------------------------------------------
// Property 4b: request() against arbitrary results, error objects and corrupt backend output.
// ---------------------------------------------------------------------------------------------

type ResponseOp =
	| { k: 'value'; v: JsonValue }
	| { k: 'error'; e: { code: number; message: string; data?: JsonValue } }
	| { k: 'badError'; e: JsonValue }
	| { k: 'rawOk'; out: string; v: JsonValue }
	| { k: 'raw'; out: string | null }
type ResponseScenario = { delays: number[]; ops: ResponseOp[] }

const ERROR_CODES = [
	0,
	1,
	3,
	-1,
	-32000,
	-32601,
	-32602,
	-32603,
	-32700,
	4001,
	1.5,
	-2.5,
	Number.MAX_SAFE_INTEGER,
	Number.MIN_SAFE_INTEGER,
	2 ** 53 + 2,
	1e21,
	-1e308,
]
/** Output a JSON-RPC server must never produce for a call with an id. */
const INVALID_RESPONSES: (string | null)[] = [
	null,
	'null',
	'42',
	'"text"',
	'true',
	'[]',
	'[{"jsonrpc":"2.0","id":1,"result":1}]',
	'{}',
	'{"jsonrpc":"2.0","id":1}',
	'',
	' ',
	'wasm trap: unreachable',
	'{"jsonrpc":"2.0","id":1,"resu',
	'{"result":1',
	'\u0000',
	'undefined',
	'NaN',
	'{"result":1}}',
]

const genResponseOp = (r: Rng): ResponseOp => {
	switch (r.int(6)) {
		case 0:
		case 1:
			return { k: 'value', v: genJson(r) }
		case 2: {
			const e: { code: number; message: string; data?: JsonValue } = {
				code: r.pick(ERROR_CODES),
				message: r.pick(STRINGS),
			}
			if (r.bool(0.7)) e.data = genJson(r)
			return { k: 'error', e }
		}
		case 3:
			return {
				k: 'badError',
				e: r.pick<JsonValue>(['execution reverted', 42, true, [], ['x'], {}, { message: 'no code' }, { code: 7 }]),
			}
		case 4: {
			const v = genJson(r)
			return {
				k: 'rawOk',
				v,
				out: JSON.stringify(r.bool() ? { jsonrpc: '2.0', id: 1, result: v, error: null } : { result: v }),
			}
		}
		default:
			return { k: 'raw', out: r.bool(0.2) ? genGarbage(r).replace(/^/, '!') : r.pick(INVALID_RESPONSES) }
	}
}
const genResponseScenario = (r: Rng): ResponseScenario => ({
	delays: r.bool(0.7) ? [] : Array.from({ length: 4 }, () => r.pick([SYNC, MICRO, IMMEDIATE, 0, 1])),
	ops: Array.from({ length: 1 + r.int(14) }, () => genResponseOp(r)),
})

async function propResponses(s: ResponseScenario): Promise<void> {
	const { backend, state } = createFuzzBackend({ delays: s.delays })
	const engine = createZevmEngine({ backend })
	const log: { type: 'request' | 'response'; request: unknown; result?: unknown }[] = []
	engine.events.on('request', (request) => log.push({ type: 'request', request }))
	engine.events.on('response', ({ request, result }) => log.push({ type: 'response', request, result }))
	try {
		const requests = s.ops.map((op) =>
			op.k === 'value'
				? { method: 'fuzz_echo', params: [op.v] }
				: op.k === 'error' || op.k === 'badError'
					? { method: 'fuzz_error', params: [op.e] }
					: { method: 'fuzz_raw', params: [op.out] },
		)
		const results = await Promise.all(requests.map((request) => outcome(engine.request(request))))
		const expectedLog: typeof log = []
		for (const [index, op] of s.ops.entries()) {
			const result = results[index] as Outcome<JsonValue>
			const request = requests[index]
			expectedLog.push({ type: 'request', request })
			if (op.k === 'value' || op.k === 'rawOk') {
				if (!result.ok) throw result.error
				expect(result.value).toEqual(JSON.parse(JSON.stringify(op.v)))
				expectedLog.push({ type: 'response', request, result: result.value })
				continue
			}
			if (result.ok) throw new Error(`request resolved with ${show(result.value)} for backend scenario ${show(op)}`)
			const error = result.error as NativeRpcError & { shortMessage: string }
			expect(error).toBeInstanceOf(Error)
			if (op.k === 'error') {
				expect(error).toBeInstanceOf(NativeRpcError)
				expect(error.code).toBe(op.e.code)
				expect(error.shortMessage).toBe(op.e.message)
				expect(error.message).toContain(op.e.message)
				expect(error.data).toEqual(op.e.data)
			} else if (op.k === 'badError') {
				expect(error).toBeInstanceOf(NativeRpcError)
			} else {
				// Corrupt output is a transport fault, not a structured node error.
				expect(error).not.toBeInstanceOf(NativeRpcError)
			}
		}
		// Exactly one 'request' per call and one paired 'response' per success, in FIFO order.
		expect(log.length).toBe(expectedLog.length)
		for (const [index, entry] of log.entries()) {
			const expected = expectedLog[index] as (typeof log)[number]
			expect(entry.type).toBe(expected.type)
			expect(entry.request).toBe(expected.request)
			if (entry.type === 'response') expect(entry.result).toBe(expected.result)
		}
		expect(state.maxInFlight).toBeLessThanOrEqual(1)
		expect(await engine.request({ method: 'fuzz_echo', params: ['alive'] })).toBe('alive')
	} finally {
		await engine.close()
	}
}

// ---------------------------------------------------------------------------------------------
// Property 4c: option boundaries and invalid backend objects.
// ---------------------------------------------------------------------------------------------

const NUMERIC_POOL: unknown[] = [
	undefined,
	undefined,
	0,
	-0,
	1,
	2,
	31337,
	2 ** 32,
	Number.MAX_SAFE_INTEGER,
	Number.MAX_SAFE_INTEGER + 1,
	2 ** 53,
	1e21,
	Number.MAX_VALUE,
	-1,
	-31337,
	Number.MIN_SAFE_INTEGER,
	-Number.MAX_VALUE,
	0.5,
	1.5,
	-0.5,
	Number.EPSILON,
	Number.MIN_VALUE,
	Number.NaN,
	Number.POSITIVE_INFINITY,
	Number.NEGATIVE_INFINITY,
	'1',
	'0x1',
	'',
	null,
	true,
	false,
	1n,
	{},
	[],
	[1],
]
const BACKEND_KINDS = [
	'valid',
	'valid',
	'class',
	'fnobj',
	'null',
	'empty',
	'noClose',
	'noRpc',
	'rpcString',
	'closeNull',
	'number',
	'string',
	'array',
	'bareFn',
] as const
const CONSOLE_KINDS = ['undefined', 'undefined', 'true', 'false', 'fn', 'string', 'number', 'null', 'object'] as const
type OptionScenario = {
	chainId: unknown
	hasMining: boolean
	interval: unknown
	hasFork: boolean
	blockNumber: unknown
	consoleLog: (typeof CONSOLE_KINDS)[number]
	backend: (typeof BACKEND_KINDS)[number]
}
/** Bias toward valid values so the success path and later validation stages are reached. */
const genNumeric = (r: Rng) =>
	r.bool(0.45) ? r.pick([undefined, 0, 1, r.int(1e9), Number.MAX_SAFE_INTEGER]) : r.pick(NUMERIC_POOL)
const genOptions = (r: Rng): OptionScenario => ({
	chainId: genNumeric(r),
	hasMining: r.bool(0.7),
	interval: genNumeric(r),
	hasFork: r.bool(0.7),
	blockNumber: genNumeric(r),
	consoleLog: r.bool(0.6) ? 'undefined' : r.pick(CONSOLE_KINDS),
	backend: r.bool(0.5) ? 'valid' : r.pick(BACKEND_KINDS),
})

const isUnsignedSafeInteger = (value: unknown) =>
	value === undefined ||
	(typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER)

async function propOptions(s: OptionScenario): Promise<void> {
	const { backend, state } = createFuzzBackend()
	const candidates: Record<OptionScenario['backend'], unknown> = {
		valid: backend,
		class: new (class {
			rpc(json: string) {
				return backend.rpc(json)
			}
			close() {
				return backend.close()
			}
		})(),
		fnobj: Object.assign(() => {}, backend),
		null: null,
		empty: {},
		noClose: { rpc: backend.rpc },
		noRpc: { close: backend.close },
		rpcString: { rpc: 'rpc', close: backend.close },
		closeNull: { rpc: backend.rpc, close: null },
		number: 42,
		string: 'wasm',
		array: [backend.rpc, backend.close],
		bareFn: () => {},
	}
	const consoleLogs: Record<OptionScenario['consoleLog'], unknown> = {
		undefined: undefined,
		true: true,
		false: false,
		fn: () => {},
		string: 'yes',
		number: 1,
		null: null,
		object: {},
	}
	const backendValid = s.backend === 'valid' || s.backend === 'class' || s.backend === 'fnobj'
	const consoleValid = ['undefined', 'true', 'false', 'fn'].includes(s.consoleLog)
	const options = {
		chainId: s.chainId,
		...(s.hasMining ? { mining: { interval: s.interval } } : {}),
		...(s.hasFork ? { fork: { url: 'http://fuzz.invalid', blockNumber: s.blockNumber } } : {}),
		...(s.consoleLog === 'undefined' ? {} : { consoleLog: consoleLogs[s.consoleLog] }),
		backend: candidates[s.backend],
	} as ZevmEngineOptions
	// Validation order is part of the contract: numeric options, then consoleLog, then the backend.
	const expectedMessage = !isUnsignedSafeInteger(s.chainId)
		? 'chainId must be an unsigned safe integer'
		: s.hasMining && !isUnsignedSafeInteger(s.interval)
			? 'interval must be an unsigned safe integer'
			: s.hasFork && !isUnsignedSafeInteger(s.blockNumber)
				? 'blockNumber must be an unsigned safe integer'
				: !consoleValid
					? 'consoleLog must be a boolean or a function'
					: !backendValid
						? 'backend must implement rpc(json) and close()'
						: undefined
	if (expectedMessage !== undefined) {
		let thrown: unknown
		try {
			createZevmEngine(options)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(TypeError)
		expect((thrown as TypeError).message).toBe(expectedMessage)
		// A rejected configuration never touches the caller's backend.
		expect(state.received).toEqual([])
		expect(state.closeCalls).toBe(0)
		return
	}
	const engine = createZevmEngine(options)
	try {
		await engine.ready()
		const expectedInit: unknown[] = []
		if (s.hasFork) {
			expectedInit.push({
				method: 'anvil_reset',
				params: [
					{
						forking: {
							jsonRpcUrl: 'http://fuzz.invalid',
							...(s.blockNumber === undefined ? {} : { blockNumber: s.blockNumber }),
						},
					},
				],
			})
		}
		if (s.hasMining && s.interval !== undefined)
			expectedInit.push({ method: 'evm_setIntervalMining', params: [s.interval] })
		expect(state.received.map((json) => JSON.parse(json)).map(({ method, params }) => ({ method, params }))).toEqual(
			JSON.parse(JSON.stringify(expectedInit)),
		)
		expect(await engine.request({ method: 'fuzz_echo', params: ['alive'] })).toBe('alive')
	} finally {
		await engine.close()
	}
	expect(state.closeCalls).toBe(1)
}

// ---------------------------------------------------------------------------------------------
// Property 5a: 'request' / 'response' / 'block' / 'close' event pairing under concurrency.
// ---------------------------------------------------------------------------------------------

type EventKind = 'ok' | 'err' | 'throw' | 'rpc' | 'mine'
type EventScenario = { delays: number[]; block: boolean; ops: { k: EventKind; gap: number }[] }
const genEvents = (r: Rng): EventScenario => ({
	delays: genDelays(r),
	block: r.bool(0.6),
	ops: Array.from({ length: 1 + r.int(12) }, () => ({
		k: r.pick<EventKind>(['ok', 'ok', 'err', 'throw', 'rpc', 'mine', 'mine']),
		gap: genGap(r),
	})),
})

async function propEvents(s: EventScenario): Promise<void> {
	const { backend } = createFuzzBackend({ delays: s.delays })
	const engine = createZevmEngine({ backend })
	type Entry = {
		type: 'request' | 'response' | 'block' | 'close'
		request?: unknown
		result?: unknown
		number?: bigint
	}
	const log: Entry[] = []
	engine.events.on('request', (request) => log.push({ type: 'request', request }))
	engine.events.on('response', ({ request, result }) => log.push({ type: 'response', request, result }))
	engine.events.on('close', () => log.push({ type: 'close' }))
	if (s.block) engine.events.on('block', (block) => log.push({ type: 'block', number: blockNumberOf(block) }))
	const requests = s.ops.map((op, index) =>
		op.k === 'mine'
			? { method: 'evm_mine' }
			: op.k === 'err'
				? { method: 'fuzz_error', params: [{ code: -32000, message: 'boom' }] }
				: { method: op.k === 'throw' ? 'fuzz_throw' : 'fuzz_echo', params: [{ nested: index }] },
	)
	const pending: Promise<Outcome<unknown>>[] = []
	for (const [index, op] of s.ops.entries()) {
		pending.push(
			outcome(
				op.k === 'rpc'
					? engine.rpc(JSON.stringify({ jsonrpc: '2.0', id: index, ...requests[index] }))
					: engine.request(requests[index] as { method: string }),
			),
		)
		if (op.gap !== SYNC) await wait(op.gap)
	}
	const results = await Promise.all(pending)
	await engine.close()
	await engine.close()

	const expected: Entry[] = []
	let mined = 0n
	for (const [index, op] of s.ops.entries()) {
		const result = results[index] as Outcome<unknown>
		if (op.k === 'rpc') {
			if (!result.ok) throw result.error
			continue
		}
		expected.push({ type: 'request', request: requests[index] })
		if (op.k === 'err' || op.k === 'throw') {
			if (result.ok) throw new Error(`${op.k} request ${index} resolved`)
			continue
		}
		if (!result.ok) throw result.error
		// A mined block is announced between the request and its response.
		if (op.k === 'mine' && s.block) expected.push({ type: 'block', number: ++mined })
		expected.push({ type: 'response', request: requests[index], result: result.value })
	}
	expected.push({ type: 'close' })
	expect(log.map((entry) => entry.type)).toEqual(expected.map((entry) => entry.type))
	for (const [index, entry] of log.entries()) {
		const want = expected[index] as Entry
		// Events carry the caller's request object and the exact result the promise resolved with.
		expect(entry.request).toBe(want.request)
		expect(entry.result).toBe(want.result)
		expect(entry.number).toBe(want.number)
	}
	for (const name of ['request', 'response', 'block', 'close']) expect(engine.events.listenerCount(name)).toBe(0)
}

// ---------------------------------------------------------------------------------------------
// Property 5b: block events cover exactly baseline+1..head, in order, per subscription.
// ---------------------------------------------------------------------------------------------

type BlockKind = 'mine' | 'bg' | 'flush' | 'on' | 'inflightOn' | 'off' | 'fail' | 'poll'
type BlockScenario = { delays: number[]; ops: { k: BlockKind; n: number }[] }
const genBlocks = (r: Rng): BlockScenario => {
	let polls = r.bool(0.12) ? 1 : 0
	return {
		delays: r.bool(0.5) ? [] : Array.from({ length: 4 }, () => r.pick([SYNC, MICRO, IMMEDIATE, 0, 1, 3])),
		ops: Array.from({ length: 2 + r.int(14) }, () => {
			let k = r.pick<BlockKind>([
				'mine',
				'mine',
				'bg',
				'bg',
				'flush',
				'on',
				'on',
				'inflightOn',
				'inflightOn',
				'off',
				'fail',
				'poll',
			])
			if (k === 'poll' && polls-- <= 0) k = 'bg'
			return { k, n: 1 + r.int(5) }
		}),
	}
}

async function propBlocks(s: BlockScenario): Promise<void> {
	const { backend, state } = createFuzzBackend({ delays: s.delays })
	const engine = createZevmEngine({ backend })
	let closeEvents = 0
	engine.events.on('close', () => closeEvents++)
	let listener: ((block: unknown) => void) | undefined
	let numbers: bigint[] = []
	let baseline = 0n
	const flush = () => engine.request({ method: 'fuzz_echo', params: ['flush'] })
	const subscribe = () => {
		const mine: bigint[] = []
		numbers = mine
		listener = (block) => mine.push(blockNumberOf(block))
		engine.events.on('block', listener)
	}
	const assertExact = (step: string) => {
		const want = range(baseline, state.head)
		if (show(numbers) !== show(want)) {
			throw new Error(
				`after ${step}: block events ${show(numbers)} != expected ${show(want)} (baseline ${baseline}, head ${state.head})`,
			)
		}
	}
	try {
		for (const [index, op] of s.ops.entries()) {
			const step = `${op.k}#${index}`
			switch (op.k) {
				case 'mine':
					await engine.request({ method: 'evm_mine' })
					if (listener) assertExact(step)
					break
				case 'bg':
					state.head += BigInt(op.n)
					break
				case 'flush':
					await flush()
					if (listener) assertExact(step)
					break
				case 'on':
					if (listener) break
					subscribe()
					baseline = state.head
					await flush()
					assertExact(step)
					break
				case 'inflightOn': {
					// Subscribe while a request is executing inside the backend.
					if (listener) break
					const inFlight = engine.request(
						op.n % 2 === 0 ? { method: 'evm_mine' } : { method: 'fuzz_echo', params: ['x'] },
					)
					await wait(op.n % 3 === 0 ? 1 : IMMEDIATE)
					subscribe()
					await inFlight
					baseline = state.head
					await flush()
					assertExact(step)
					break
				}
				case 'off':
					if (listener) engine.events.off('block', listener)
					listener = undefined
					break
				case 'fail': {
					// One eth_getBlockByNumber fails mid-emission; the missed blocks must arrive later, once.
					if (!listener) break
					state.head += BigInt(op.n)
					state.failNextGetBlock = true
					await flush().catch(() => {})
					const want = range(baseline, state.head)
					if (show(numbers) !== show(want.slice(0, numbers.length)))
						throw new Error(`after ${step}: ${show(numbers)} is not a prefix of ${show(want)}`)
					await flush()
					assertExact(step)
					break
				}
				case 'poll': {
					// No request: only the engine's poll timer can announce these blocks.
					if (!listener) break
					state.head += BigInt(op.n)
					const want = range(baseline, state.head).length
					for (let waited = 0; numbers.length < want && waited < 2000; waited += 5) await wait(5)
					assertExact(step)
					break
				}
			}
		}
	} finally {
		await engine.close()
	}
	expect(closeEvents).toBe(1)
	// Nothing is announced after close.
	const emitted = numbers.length
	state.head += 3n
	await wait(IMMEDIATE)
	expect(numbers.length).toBe(emitted)
}

// ---------------------------------------------------------------------------------------------
// Suites.
// ---------------------------------------------------------------------------------------------

describe(`createZevmEngine pluggable backend fuzz (FUZZ_SEED=${BASE_SEED}, FUZZ_RUNS=${RUNS})`, () => {
	it('1. serializes request() and rpc() FIFO with max backend concurrency 1 under arbitrary async jitter', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('fifo', { gen: genFifo, prop: propFifo })
	})

	it('2. survives close() interleaved with requests, raw rpc, block subscriptions and repeated close()', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('close', { gen: genClose, prop: propClose })
	})

	it('3. cleans up when fork or mining initialization throws, rejects or returns corrupt output', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('init-failure', { gen: genInitFail, prop: propInitFail })
	})

	it('4a. passes arbitrary valid and malformed wire strings through rpc() byte-exact and in order', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('wire', { gen: genWireScenario, prop: propWire, batch: 100 })
	})

	it('4b. maps arbitrary results, error objects and corrupt backend output through request()', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('responses', { gen: genResponseScenario, prop: propResponses, batch: 100 })
	})

	it('4c. validates chainId, interval, blockNumber, consoleLog and backend boundaries before touching the backend', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('options', { runs: RUNS * 3, gen: genOptions, prop: propOptions, batch: 100 })
	})

	it("5a. pairs 'request' and 'response' events exactly and emits 'close' once, last", {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('events', { gen: genEvents, prop: propEvents })
	})

	it('5b. emits every block from the subscription baseline to the head exactly once, in order', {
		timeout: TEST_TIMEOUT,
	}, async () => {
		await fuzz('blocks', { gen: genBlocks, prop: propBlocks })
	})
})

// ---------------------------------------------------------------------------------------------
// Shrunk regressions for defects the properties above found in createZevmEngine.js.
// ---------------------------------------------------------------------------------------------

describe('createZevmEngine pluggable backend regressions found by fuzzing', () => {
	it('does not leave a poll timer behind when a block listener is added while failed initialization closes the backend', async () => {
		const { backend, state } = createFuzzBackend({ closeDelay: 10, fail: { method: 'evm_setAutomine', mode: 'error' } })
		const engine = createZevmEngine({ backend, mining: { auto: false } })
		await settle()
		expect(state.closeCalls).toBe(1)
		// backend.close() is still pending here.
		engine.events.on('block', () => {})
		await expect(engine.ready()).rejects.toBeInstanceOf(NativeRpcError)
		expect(takeGlobalViolation()).toBeUndefined()
	})

	it('rejects ready() with the initialization error and closes once when backend.close() also throws', async () => {
		const { backend, state } = createFuzzBackend({
			closeThrows: true,
			fail: { method: 'evm_setAutomine', mode: 'asyncReject' },
		})
		const engine = createZevmEngine({ backend, mining: { auto: false } })
		await expect(engine.ready()).rejects.toBe(state.thrown)
		await expect(engine.request({ method: 'fuzz_echo' })).rejects.toBe(state.thrown)
		await expect(engine.close()).resolves.toBeUndefined()
		expect(state.closeCalls).toBe(1)
	})

	it('does not replay blocks mined before a subscription made while a request is in flight', async () => {
		const { backend, state } = createFuzzBackend({ delays: [3] })
		const engine = createZevmEngine({ backend })
		for (let i = 0; i < 3; i++) await engine.request({ method: 'evm_mine' })
		const inFlight = engine.request({ method: 'fuzz_echo', params: ['x'] })
		await wait(IMMEDIATE)
		expect(state.inFlight).toBe(1)
		const numbers: bigint[] = []
		engine.events.on('block', (block) => numbers.push(blockNumberOf(block)))
		await inFlight
		await engine.request({ method: 'fuzz_echo', params: ['flush'] })
		expect(numbers).toEqual([])
		await engine.request({ method: 'evm_mine' })
		expect(numbers).toEqual([4n])
		await engine.close()
	})

	it('re-announces blocks whose fetch failed instead of skipping them', async () => {
		const { backend, state } = createFuzzBackend()
		const engine = createZevmEngine({ backend })
		const numbers: bigint[] = []
		engine.events.on('block', (block) => numbers.push(blockNumberOf(block)))
		await engine.request({ method: 'fuzz_echo' })
		state.head += 3n
		state.failNextGetBlock = true
		await engine.request({ method: 'fuzz_echo' }).catch(() => {})
		await engine.request({ method: 'fuzz_echo' })
		expect(numbers).toEqual([1n, 2n, 3n])
		await engine.close()
	})

	it.each([
		['42'],
		['[]'],
		['"text"'],
		['true'],
		['{}'],
		['{"jsonrpc":"2.0","id":1}'],
		['null'],
		[null],
	])('rejects request() instead of resolving undefined when the backend returns %s', async (output) => {
		const { backend } = createFuzzBackend()
		const engine = createZevmEngine({ backend })
		const error = await rejection(engine.request({ method: 'fuzz_raw', params: [output] }))
		expect(error).toBeInstanceOf(Error)
		expect(error).not.toBeInstanceOf(NativeRpcError)
		expect(error.message).toContain('invalid JSON-RPC response')
		expect(await engine.request({ method: 'fuzz_echo', params: ['alive'] })).toBe('alive')
		await engine.close()
	})

	it("emits 'close' once and drops listeners when backend.close() rejects", async () => {
		const { backend, state } = createFuzzBackend({ closeDelay: 1, closeThrows: true })
		const engine = createZevmEngine({ backend })
		let closeEvents = 0
		engine.events.on('close', () => closeEvents++)
		engine.events.on('block', () => {})
		await expect(engine.close()).rejects.toBe(state.closeError)
		expect(closeEvents).toBe(1)
		expect(engine.events.listenerCount('close')).toBe(0)
		expect(engine.events.listenerCount('block')).toBe(0)
		await expect(engine.close()).resolves.toBeUndefined()
		await expect(engine.request({ method: 'fuzz_echo' })).rejects.toThrow('engine is closed')
		expect(state.closeCalls).toBe(1)
		expect(closeEvents).toBe(1)
		expect(takeGlobalViolation()).toBeUndefined()
	})
})

describe('createZevmEngine pluggable backend pinned guards', () => {
	it('does not leak an unhandled rejection when eth_blockNumber fails while subscribing to blocks', async () => {
		const backend: ZevmBackend = {
			rpc: (json) =>
				JSON.stringify({
					jsonrpc: '2.0',
					id: JSON.parse(json).id,
					error: { code: -32000, message: 'head unavailable' },
				}),
			close: () => {},
		}
		const engine = createZevmEngine({ backend })
		engine.events.on('block', () => {})
		await settle()
		await engine.close()
		await settle()
		expect(takeGlobalViolation()).toBeUndefined()
	})
})
