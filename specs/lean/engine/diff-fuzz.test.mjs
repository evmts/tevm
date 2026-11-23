/**
 * Stateful differential fuzzer: Lean 4 reference specification versus the live engine.
 *
 * Every generated command trace runs against three systems:
 *   (L) the compiled Lean oracle `engine-spec` (`EngineFsmSpec.lean`, `Main.lean`);
 *   (A) `createZevmEngine()` on the native ZEVM addon;
 *   (B) `createZevmEngine({ backend })` on a pluggable async WASM-style `ZevmBackend`
 *       that bridges an isolated native node with randomized latency and JSON round trips.
 *
 * After every step the harness renders the same line the oracle prints:
 *
 *   <trace> <step> <outcome> <backend ids sent> <backend closes> <state>
 *
 * (B) must match the whole line. (A) hides its backend, so it must match the trace,
 * step, outcome and state columns. Any difference fails the run.
 *
 * Run:    node --test specs/lean/engine/diff-fuzz.test.mjs
 * Replay: FUZZ_SEED=<n> FUZZ_TRACES=<n> node --test specs/lean/engine/diff-fuzz.test.mjs
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire, registerHooks } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { before, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../..')
const engineSource = join(repo, 'packages/node/src/createZevmEngine.js')
const oracle = join(here, '.lake/build/bin/engine-spec')

// `createZevmEngine.js` imports `decodeHardhatConsoleLog` from `@tevm/utils`. This suite
// runs the live source without a package build, so resolve that import to the source file.
const utilsSource = pathToFileURL(join(repo, 'packages/utils/src/decodeHardhatConsoleLog.js')).href
registerHooks({
	resolve: (specifier, context, nextResolve) =>
		specifier === '@tevm/utils' ? { url: utilsSource, shortCircuit: true } : nextResolve(specifier, context),
})
const { createZevmEngine } = await import(pathToFileURL(engineSource).href)
const { NativeNode } = createRequire(engineSource)('@evmts/zevm')

const SEED = Number(process.env.FUZZ_SEED ?? 20261123)
const TRACES = Number(process.env.FUZZ_TRACES ?? 320)
const CONCURRENCY = 8

// ---------------------------------------------------------------------------------------
// Deterministic generator
// ---------------------------------------------------------------------------------------

/** mulberry32: fully determined by its 32-bit seed. */
const prng = (seed) => {
	let s = seed >>> 0
	const next = () => {
		s = (s + 0x6d2b79f5) >>> 0
		let t = s
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
	const int = (n) => Math.floor(next() * n)
	return { next, int, bool: (p = 0.5) => next() < p, pick: (items) => items[int(items.length)] }
}

const U256 = 2n ** 256n
const U64 = 2n ** 64n
const q = (value) => `0x${value.toString(16)}`
const address = (value) => `0x${value.toString(16).padStart(40, '0')}`

/** Accounts whose full state the oracle reports after every step. */
const ADDRS = [0xa1n, 0xa2n, 0xa3n, (1n << 160n) - 1n]
/** `eth_call` targets. They never receive code, so the call returns `0x`. */
const CALL_TARGETS = [0xc1n, 0xc2n]
const SLOTS = [0n, 1n, U256 - 1n]

const randomBig = (rng, bits) => {
	let value = 0n
	for (let i = 0; i < bits; i += 16) value = (value << 16n) | BigInt(rng.int(65536))
	return value & ((1n << BigInt(bits)) - 1n)
}
/** A value below `limit`, biased to the edges. One draw in 25 equals `limit`: invalid. */
const bounded = (rng, limit, bits) => {
	const roll = rng.int(25)
	if (roll === 0) return limit
	if (roll < 4) return limit - 1n
	if (roll < 7) return 0n
	if (roll < 14) return BigInt(rng.int(256))
	return randomBig(rng, bits)
}

/**
 * One generated trace: the oracle configuration and the commands.
 * A command is the list of fields of one oracle input line.
 */
const generateTrace = (rng, name) => {
	const consoleLog = rng.bool(0.6)
	const backendDrains = rng.bool(0.5)
	const steps = 15 + rng.int(46)
	const ops = []
	let snapshots = 0
	let closedFor = -1
	for (let i = 0; i < steps; i++) {
		if (closedFor >= 0 && ++closedFor > 6) break
		const roll = rng.int(100)
		const a = q(rng.pick(ADDRS))
		if (roll < 3 || (closedFor >= 0 && roll < 25)) {
			ops.push(['close'])
			if (closedFor < 0) closedFor = 0
		} else if (roll < 14) ops.push(['setBalance', a, q(bounded(rng, U256, 256))])
		else if (roll < 22) ops.push(['setNonce', a, q(bounded(rng, U64, 64))])
		else if (roll < 34) {
			const slot = rng.int(30) === 0 ? U256 : rng.pick(SLOTS)
			ops.push(['setStorageAt', a, q(slot), q(bounded(rng, U256, 256))])
		} else if (roll < 39) {
			const bytes = rng.int(9)
			let code = '0x'
			for (let b = 0; b < bytes; b++) code += rng.int(256).toString(16).padStart(2, '0')
			ops.push(['setCode', a, code])
		} else if (roll < 49) ops.push(['mine', q(rng.int(40) === 0 ? U64 : BigInt(rng.pick([1, 1, 1, 0, 2, 3])))])
		else if (roll < 60) {
			ops.push(['snapshot'])
			snapshots++
		} else if (roll < 71) {
			const kind = rng.int(20)
			const id =
				kind === 0
					? U64
					: kind === 1
						? 0n
						: kind < 5
							? BigInt(snapshots + 1 + rng.int(3))
							: BigInt(1 + rng.int(snapshots + 1))
			ops.push(['revert', q(id)])
		} else if (roll < 76) ops.push(['getBalance', a])
		else if (roll < 80) ops.push(['getTransactionCount', a])
		else if (roll < 83) ops.push(['getCode', a])
		else if (roll < 88) ops.push(['getStorageAt', a, q(rng.int(30) === 0 ? U256 : rng.pick(SLOTS))])
		else if (roll < 91) ops.push(['blockNumber'])
		else if (roll < 96) ops.push(['call', q(rng.pick(CALL_TARGETS))])
		else if (roll < 98) ops.push(['callInvalid'])
		else ops.push(['unknown'])
	}
	return { name, consoleLog, backendDrains, ops }
}

/** Render traces as oracle input. */
const oracleInput = (traces) =>
	traces
		.map(
			(trace) =>
				`${['T', trace.name, trace.consoleLog ? 1 : 0, trace.backendDrains ? 1 : 0, ADDRS.map(q).join(','), SLOTS.map(q).join(',')].join('\t')}\n${trace.ops.map((op) => `${op.join('\t')}\n`).join('')}`,
		)
		.join('')

/** Run the Lean oracle over all traces. Returns the expected lines of each trace. */
const runOracle = (traces) => {
	const result = spawnSync(oracle, [], { input: oracleInput(traces), encoding: 'utf8', maxBuffer: 1 << 30 })
	assert.equal(result.status, 0, `engine-spec failed: ${result.stderr}`)
	const expected = new Map(traces.map((trace) => [trace.name, []]))
	for (const line of result.stdout.split('\n')) {
		if (line === '') continue
		expected.get(line.slice(0, line.indexOf('\t'))).push(line)
	}
	for (const trace of traces)
		assert.equal(expected.get(trace.name).length, trace.ops.length, `${trace.name}: oracle line count`)
	return expected
}

// ---------------------------------------------------------------------------------------
// Live engine drivers
// ---------------------------------------------------------------------------------------

/** The JSON-RPC request a command stands for. `rng` varies equivalent encodings. */
const toRequest = ([kind, ...args], rng) => {
	const addr = () => address(BigInt(args[0]))
	switch (kind) {
		case 'setBalance':
			return { method: 'anvil_setBalance', params: [addr(), args[1]] }
		case 'setNonce':
			return { method: 'anvil_setNonce', params: [addr(), args[1]] }
		case 'setCode':
			return { method: 'anvil_setCode', params: [addr(), args[1]] }
		case 'setStorageAt': {
			const value = BigInt(args[2])
			// A 32-byte word and a quantity name the same value.
			const encoded = value < U256 && rng.bool() ? `0x${value.toString(16).padStart(64, '0')}` : args[2]
			return { method: 'anvil_setStorageAt', params: [addr(), args[1], encoded] }
		}
		case 'mine':
			return { method: 'evm_mine', params: args[0] === '0x1' && rng.bool() ? [] : [args[0]] }
		case 'snapshot':
			return { method: 'evm_snapshot', params: [] }
		case 'revert':
			return { method: 'evm_revert', params: [args[0]] }
		case 'getBalance':
			return { method: 'eth_getBalance', params: [addr(), 'latest'] }
		case 'getTransactionCount':
			return { method: 'eth_getTransactionCount', params: [addr(), 'latest'] }
		case 'getCode':
			return { method: 'eth_getCode', params: [addr(), 'latest'] }
		case 'getStorageAt':
			return { method: 'eth_getStorageAt', params: [addr(), args[1], 'latest'] }
		case 'blockNumber':
			return { method: 'eth_blockNumber', params: [] }
		case 'call':
			return { method: 'eth_call', params: [{ to: addr() }, 'latest'] }
		case 'callInvalid':
			return { method: 'eth_call', params: [] }
		case 'unknown':
			return { method: 'eth_specUnknownMethod', params: [] }
		default:
			throw new Error(`unknown command ${kind}`)
	}
}

/** Render how one engine operation settled, in the oracle's notation. */
const settle = async (promise, isClose) => {
	try {
		const result = await promise
		return isClose ? 'closed' : `ok:${JSON.stringify(result)}`
	} catch (error) {
		return error?.name === 'NativeRpcError' ? `err:${error.code}` : `rejected:${error?.message}`
	}
}

/** The JSON-RPC reads that make up the oracle's state column, in column order. */
const STATE_READS = [
	{ method: 'eth_blockNumber', params: [] },
	...ADDRS.flatMap((a) => [
		{ method: 'eth_getBalance', params: [address(a), 'latest'] },
		{ method: 'eth_getTransactionCount', params: [address(a), 'latest'] },
		{ method: 'eth_getCode', params: [address(a), 'latest'] },
		...SLOTS.map((slot) => ({ method: 'eth_getStorageAt', params: [address(a), q(slot), 'latest'] })),
	]),
]
const READS_PER_ACCOUNT = 3 + SLOTS.length

/** Render the results of `STATE_READS` as the oracle's state column. */
const renderState = (values) => {
	const accounts = ADDRS.map((a, i) => {
		const [balance, nonce, code, ...storage] = values.slice(1 + i * READS_PER_ACCOUNT, 1 + (i + 1) * READS_PER_ACCOUNT)
		return `${address(a)}:${balance},${nonce},${code},${SLOTS.map((slot, k) => `${q(slot)}=${q(BigInt(storage[k]))}`).join(',')}`
	})
	return `b=${values[0]};${accounts.join(';')}`
}

const yieldRandomly = (rng) => {
	const roll = rng.int(10)
	if (roll < 5) return Promise.resolve()
	if (roll < 9) return new Promise((done) => setImmediate(done))
	return new Promise((done) => setTimeout(done, rng.int(2)))
}

/**
 * (A) The default native engine. It hides its backend, so the id and close columns are
 * not observable. State is read through the engine's own serialized queue.
 */
const runNative = async (trace, rng) => {
	const engine = trace.consoleLog ? createZevmEngine({ consoleLog: () => {} }) : createZevmEngine()
	const pipelined = rng.bool(0.4)
	const pending = []
	try {
		for (const op of trace.ops) {
			const isClose = op[0] === 'close'
			const outcome = settle(isClose ? engine.close() : engine.request(toRequest(op, rng)), isClose)
			// Issued in the same tick as the operation: the queue runs them directly after it.
			const reads = Promise.all(STATE_READS.map((read) => settle(engine.request(read), false)))
			const step = Promise.all([outcome, reads])
			pending.push(step)
			if (!pipelined) await step
		}
		const lines = []
		for (const [index, step] of pending.entries()) {
			const [outcome, reads] = await step
			let state
			if (reads.every((read) => read === 'rejected:engine is closed')) state = '-'
			else {
				assert.ok(
					reads.every((read) => read.startsWith('ok:')),
					`${trace.name} step ${index}: state read failed: ${reads.join(' ')}`,
				)
				state = renderState(reads.map((read) => JSON.parse(read.slice(3))))
			}
			lines.push([trace.name, index, outcome, state].join('\t'))
		}
		return lines
	} finally {
		await engine.close()
	}
}

/**
 * (B) A pluggable async WASM-style backend over an isolated native node. It records
 * every call the engine makes, so all oracle columns are observable.
 */
const runPluggable = async (trace, rng) => {
	const node = new NativeNode({})
	const sent = []
	let closes = 0
	let inFlight = 0
	let overlapped = false
	const backend = {
		rpc: async (json) => {
			if (inFlight++ > 0) overlapped = true
			await yieldRandomly(rng)
			const request = JSON.parse(json)
			const drain = request.method === 'tevm_drainConsoleLogs'
			sent.push(`${request.id}${drain ? 'd' : ''}`)
			const response = drain
				? trace.backendDrains
					? { jsonrpc: '2.0', id: request.id, result: [] }
					: { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } }
				: JSON.parse(node.rpc(JSON.stringify(request)))
			await yieldRandomly(rng)
			inFlight--
			return JSON.stringify(response)
		},
		close: async () => {
			await yieldRandomly(rng)
			closes++
			node.close()
		},
	}
	const options = trace.consoleLog ? { backend, consoleLog: () => {} } : { backend }
	const engine = createZevmEngine(options)
	const readState = () =>
		renderState(
			STATE_READS.map((read) => {
				const response = JSON.parse(node.rpc(JSON.stringify({ jsonrpc: '2.0', id: 0, ...read })))
				assert.ok('result' in response, `${trace.name}: state read failed: ${JSON.stringify(response)}`)
				return response.result
			}),
		)
	const pipelined = rng.bool(0.4)
	const pending = []
	let consumed = 0
	try {
		for (const [index, op] of trace.ops.entries()) {
			const isClose = op[0] === 'close'
			// The observation runs when the operation settles, before the queue starts the next one.
			const step = settle(isClose ? engine.close() : engine.request(toRequest(op, rng)), isClose).then((outcome) => {
				const ids = sent.slice(consumed)
				consumed = sent.length
				const state = closes > 0 ? '-' : readState()
				return [trace.name, index, outcome, ids.length === 0 ? '-' : ids.join(','), closes, state].join('\t')
			})
			pending.push(step)
			if (!pipelined) await step
		}
		const lines = await Promise.all(pending)
		assert.equal(overlapped, false, `${trace.name}: the engine issued overlapping backend calls`)
		return lines
	} finally {
		await engine.close()
		if (closes === 0) node.close()
	}
}

/** Keep the columns that engine (A) can observe. */
const nativeColumns = (line) => {
	const [name, index, outcome, , , state] = line.split('\t')
	return [name, index, outcome, state].join('\t')
}

/** Run every trace through `driver` and compare each step with the oracle. */
const compare = async (traces, expected, driver, project, label) => {
	let steps = 0
	const queue = [...traces.entries()]
	const worker = async () => {
		for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
			const [index, trace] = item
			const observed = await driver(trace, prng(SEED ^ (0x9e3779b9 + index)))
			const want = expected.get(trace.name).map(project)
			for (let step = 0; step < trace.ops.length; step++) {
				if (observed[step] !== want[step]) {
					assert.fail(
						`${label} differs from the Lean oracle at ${trace.name} step ${step} (FUZZ_SEED=${SEED})\n` +
							`config:   consoleLog=${trace.consoleLog} backendDrains=${trace.backendDrains}\n` +
							`commands: ${trace.ops
								.slice(0, step + 1)
								.map((op) => op.join(' '))
								.join(' | ')}\n` +
							`expected: ${want[step]}\nobserved: ${observed[step]}`,
					)
				}
				steps++
			}
			assert.equal(observed.length, want.length, `${trace.name}: step count`)
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker))
	return steps
}

// ---------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------

before(() => {
	if (existsSync(oracle)) return
	const elan = join(process.env.HOME ?? '', '.elan/bin')
	const build = spawnSync('lake', ['build'], {
		cwd: here,
		encoding: 'utf8',
		env: { ...process.env, PATH: `${elan}:${process.env.PATH}` },
	})
	assert.equal(build.status, 0, `lake build failed:\n${build.stdout}\n${build.stderr}`)
})

const rng = prng(SEED)
const traces = Array.from({ length: TRACES }, (_, index) => generateTrace(rng, `t${index}`))
let expected

test('the Lean oracle evaluates every generated trace', () => {
	assert.ok(TRACES >= 300 || process.env.FUZZ_TRACES !== undefined, 'the default corpus holds at least 300 traces')
	expected = runOracle(traces)
	const lines = [...expected.values()].flat()
	assert.ok(!lines.some((line) => line.includes('unmodeled')), 'the generator stays inside the model')
	// The corpus must reach every outcome class and both latch behaviours.
	const outcomes = new Set(lines.map((line) => line.split('\t')[2].replace(/"0x[0-9a-f]*"/, 'hex')))
	for (const outcome of [
		'ok:true',
		'ok:false',
		'ok:hex',
		'err:-32602',
		'err:-32601',
		'rejected:engine is closed',
		'closed',
	])
		assert.ok(outcomes.has(outcome), `corpus never produced ${outcome}`)
	const kinds = new Set(traces.flatMap((trace) => trace.ops.map((op) => op[0])))
	assert.equal(kinds.size, 16, 'corpus uses every command')
	const drains = lines.filter((line) => line.split('\t')[3].endsWith('d')).length
	assert.ok(drains > 0, 'corpus drains console logs')
	console.log(`oracle: ${traces.length} traces, ${lines.length} steps, ${drains} drain calls, seed ${SEED}`)
})

test('native ZEVM engine matches the Lean oracle at every step', async () => {
	const steps = await compare(traces, expected, runNative, nativeColumns, 'native engine')
	console.log(`native: ${traces.length} traces, ${steps} steps identical`)
})

test('pluggable async WASM-style backend matches the Lean oracle at every step', async () => {
	const steps = await compare(traces, expected, runPluggable, (line) => line, 'pluggable backend')
	console.log(`pluggable: ${traces.length} traces, ${steps} steps identical`)
})

test('directed trace: nested snapshots, id reuse, latch and close', async () => {
	const a = q(ADDRS[0])
	const ops = [
		['setBalance', a, '0x10'],
		['snapshot'], // 0x1
		['setStorageAt', a, '0x1', '0xff'],
		['snapshot'], // 0x2
		['mine', '0x2'],
		['setNonce', a, '0x7'],
		['snapshot'], // 0x3
		['setCode', a, '0x6001'],
		['revert', '0x2'], // restores block 0, nonce 0, slot 1 = 0xff; drops 0x3
		['revert', '0x3'], // false: dropped with 0x2
		['revert', '0x2'], // false: consumed
		['snapshot'], // 0x4: ids are never reused
		['call', q(CALL_TARGETS[0])], // first drain
		['callInvalid'], // drains again only when the backend supports it
		['call', q(CALL_TARGETS[1])],
		['revert', '0x1'], // restores balance 0x10 with empty storage; drops 0x4
		['revert', '0x4'],
		['close'],
		['close'],
		['blockNumber'],
		['snapshot'],
		['close'],
	]
	const directed = [true, false].flatMap((consoleLog) =>
		[true, false].map((backendDrains) => ({
			name: `d${+consoleLog}${+backendDrains}`,
			consoleLog,
			backendDrains,
			ops,
		})),
	)
	const want = runOracle(directed)
	const outcomes = want.get('d10').map((line) => line.split('\t').slice(2, 5).join(' '))
	assert.deepEqual(outcomes.slice(8, 22), [
		'ok:true 9 0',
		'ok:false 10 0',
		'ok:false 11 0',
		'ok:"0x4" 12 0',
		'ok:"0x" 13,14d 0',
		'err:-32602 15 0',
		'ok:"0x" 16 0',
		'ok:true 17 0',
		'ok:false 18 0',
		'closed - 1',
		'closed - 1',
		'rejected:engine is closed - 1',
		'rejected:engine is closed - 1',
		'closed - 1',
	])
	assert.equal(await compare(directed, want, runNative, nativeColumns, 'native engine'), 4 * ops.length)
	assert.equal(await compare(directed, want, runPluggable, (line) => line, 'pluggable backend'), 4 * ops.length)
})

// Known ZEVM defect, outside the modeled `latest` surface. ZEVM rebuilds historical state
// by replaying block transactions, so a block mined after `anvil_setBalance` reports the
// balance from before the edit. Anvil and Hardhat report the edited balance. The fix
// belongs in ZEVM's `replayStateToBlock`; remove `todo` when it lands.
test('historical eth_getBalance reflects anvil_setBalance edits mined into a block', {
	todo: 'ZEVM replays transactions only and drops dev-RPC state edits from historical state',
}, async () => {
	const engine = createZevmEngine()
	try {
		const a = address(ADDRS[0])
		await engine.request({ method: 'anvil_setBalance', params: [a, '0x10'] })
		await engine.request({ method: 'evm_mine', params: [] })
		await engine.request({ method: 'anvil_setBalance', params: [a, '0x20'] })
		await engine.request({ method: 'evm_mine', params: [] })
		assert.equal(await engine.request({ method: 'eth_getBalance', params: [a, 'latest'] }), '0x20')
		assert.equal(await engine.request({ method: 'eth_getBalance', params: [a, '0x2'] }), '0x20')
		assert.equal(await engine.request({ method: 'eth_getBalance', params: [a, '0x1'] }), '0x10')
	} finally {
		await engine.close()
	}
})
