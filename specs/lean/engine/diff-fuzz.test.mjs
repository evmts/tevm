/**
 * Stateful differential fuzzer: Lean 4 reference specification versus the live engine.
 *
 * Every generated command trace runs against three systems:
 *   (L) the compiled Lean oracle `engine-spec` (`EngineFsmSpec.lean`, `Main.lean`);
 *   (A) `createZevmEngine()` on the native ZEVM addon;
 *   (B) `createZevmEngine({ backend })` on a pluggable async WASM-style `ZevmBackend`
 *       that bridges an isolated native node with randomized latency, and injects the
 *       backend faults the specification models: a failing `tevm_drainConsoleLogs`, a
 *       failing initialization call and a throwing `close()`.
 *
 * A trace exercises typed `request`, raw `rpc` passthrough (single, batch, empty batch,
 * malformed text), `ready` and `close`. After initialization and after every step the
 * harness renders the same line the oracle prints:
 *
 *   <trace> <step> <outcome> <backend calls sent> <backend closes> <close events> <state>
 *
 * (B) must match the whole line. (A) hides its backend, so it must match the trace, step,
 * outcome, close-event and state columns of the same trace on a fault-free backend.
 * Any difference fails the run.
 *
 * Run:    node --test specs/lean/engine/diff-fuzz.test.mjs
 * Replay: FUZZ_SEED=<n> FUZZ_TRACES=<n> node --test specs/lean/engine/diff-fuzz.test.mjs
 * Setup:  see ../oracle.mjs for LEAN_SKIP_BUILD and ELAN_HOME.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire, registerHooks } from 'node:module'
import { join } from 'node:path'
import { before, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { buildOracle, REPO_ROOT } from '../oracle.mjs'

const here = import.meta.dirname
const engineSource = join(REPO_ROOT, 'packages/node/src/createZevmEngine.js')

// `createZevmEngine.js` imports `decodeHardhatConsoleLog` from `@tevm/utils`. This suite
// runs the live source without a package build, so resolve that import to the source file.
const utilsSource = pathToFileURL(join(REPO_ROOT, 'packages/utils/src/decodeHardhatConsoleLog.js')).href
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
/** `eth_call` and `eth_estimateGas` targets. They never receive code. */
const CALL_TARGETS = [0xc1n, 0xc2n]
const SLOTS = [0n, 1n, U256 - 1n]

/** The four methods after which the engine drains console logs, and the commands that send each. */
const CODE_EXECUTING = {
	eth_call: ['call', 'callInvalid'],
	eth_estimateGas: ['estimateGas', 'estimateGasInvalid'],
	eth_sendTransaction: ['sendTransactionInvalid'],
	eth_sendRawTransaction: ['sendRawTransactionInvalid'],
}

/** Every command a `request` or a raw payload can carry. */
const COMMAND_KINDS = [
	'setBalance',
	'setNonce',
	'setStorageAt',
	'setCode',
	'mine',
	'snapshot',
	'revert',
	'getBalance',
	'getTransactionCount',
	'getCode',
	'getStorageAt',
	'blockNumber',
	'call',
	'callInvalid',
	'estimateGas',
	'estimateGasInvalid',
	'sendTransactionInvalid',
	'sendRawTransactionInvalid',
	'unknown',
]

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
 * One backend command: the fields of one oracle command. `progress.snapshots` counts the
 * snapshots issued so far, so reverts mostly name live ids.
 */
const generateCommand = (rng, progress) => {
	const roll = rng.int(86)
	const a = q(rng.pick(ADDRS))
	if (roll < 10) return ['setBalance', a, q(bounded(rng, U256, 256))]
	if (roll < 16) return ['setNonce', a, q(bounded(rng, U64, 64))]
	if (roll < 25) {
		const slot = rng.int(30) === 0 ? U256 : rng.pick(SLOTS)
		return ['setStorageAt', a, q(slot), q(bounded(rng, U256, 256))]
	}
	if (roll < 29) {
		const bytes = rng.int(9)
		let code = '0x'
		for (let b = 0; b < bytes; b++) code += rng.int(256).toString(16).padStart(2, '0')
		return ['setCode', a, code]
	}
	if (roll < 36) return ['mine', q(rng.int(40) === 0 ? U64 : BigInt(rng.pick([1, 1, 1, 0, 2, 3])))]
	if (roll < 45) {
		progress.snapshots++
		return ['snapshot']
	}
	if (roll < 54) {
		const kind = rng.int(20)
		const id =
			kind === 0
				? U64
				: kind === 1
					? 0n
					: kind < 5
						? BigInt(progress.snapshots + 1 + rng.int(3))
						: BigInt(1 + rng.int(progress.snapshots + 1))
		return ['revert', q(id)]
	}
	if (roll < 57) return ['getBalance', a]
	if (roll < 60) return ['getTransactionCount', a]
	if (roll < 62) return ['getCode', a]
	if (roll < 66) return ['getStorageAt', a, q(rng.int(30) === 0 ? U256 : rng.pick(SLOTS))]
	if (roll < 68) return ['blockNumber']
	if (roll < 72) return ['call', q(rng.pick(CALL_TARGETS))]
	if (roll < 74) return ['callInvalid']
	if (roll < 77) return ['estimateGas', q(rng.pick(CALL_TARGETS))]
	if (roll < 79) return ['estimateGasInvalid']
	if (roll < 81) return ['sendTransactionInvalid']
	if (roll < 83) return ['sendRawTransactionInvalid']
	return ['unknown']
}

/**
 * One generated trace: the oracle configuration and the operations.
 * An operation is the list of fields of one oracle input line.
 */
const generateTrace = (rng, name) => {
	const consoleLog = rng.bool(0.65)
	const drain = rng.pick(['supported', 'supported', 'unsupported', 'unsupported', 'fails', 'fails', 'fails'])
	const init = rng.pick(['none', 'none', 'none', 'none', 'none', 'none', 'ok', 'ok', 'ok', 'fails'])
	const closeThrows = rng.bool(0.3)
	const steps = 15 + rng.int(46)
	const progress = { snapshots: 0 }
	const ops = []
	let closedFor = init === 'fails' ? 0 : -1
	for (let i = 0; i < steps; i++) {
		if (closedFor >= 0 && ++closedFor > 6) break
		const roll = rng.int(100)
		if (roll < 3 || (closedFor >= 0 && roll < 25)) {
			ops.push(['close'])
			if (closedFor < 0) closedFor = 0
		} else if (roll < 86) ops.push(generateCommand(rng, progress))
		else if (roll < 88) ops.push(['ready'])
		else {
			// Raw passthrough. A command is one field: its own fields joined by spaces.
			const kind = rng.int(10)
			if (kind === 0) ops.push(['rpc', 'malformed'])
			else if (kind === 1) ops.push(['rpc', 'batch'])
			else if (kind < 6) ops.push(['rpc', 'single', generateCommand(rng, progress).join(' ')])
			else
				ops.push([
					'rpc',
					'batch',
					...Array.from({ length: 1 + rng.int(4) }, () => generateCommand(rng, progress).join(' ')),
				])
		}
	}
	return { name, consoleLog, drain, init, closeThrows, ops }
}

/** The same trace on a backend without injected faults: what the native engine (A) runs. */
const faultFree = (trace) => ({ ...trace, drain: 'unsupported', closeThrows: false })

/** Render traces as oracle input. */
const oracleInput = (traces) =>
	traces
		.map(
			(trace) =>
				`${[
					'T',
					trace.name,
					trace.consoleLog ? 1 : 0,
					trace.drain,
					trace.init,
					trace.closeThrows ? 1 : 0,
					ADDRS.map(q).join(','),
					SLOTS.map(q).join(','),
				].join('\t')}\n${trace.ops.map((op) => `${op.join('\t')}\n`).join('')}`,
		)
		.join('')

let oracle

/**
 * Run the Lean oracle over all traces. Returns the expected lines of each trace: the
 * `init` line first, then one line per operation.
 */
const runOracle = (traces) => {
	const result = spawnSync(oracle, [], { input: oracleInput(traces), encoding: 'utf8', maxBuffer: 1 << 30 })
	assert.equal(result.status, 0, `engine-spec failed: ${result.stderr}`)
	const expected = new Map(traces.map((trace) => [trace.name, []]))
	for (const line of result.stdout.split('\n')) {
		if (line === '') continue
		expected.get(line.slice(0, line.indexOf('\t'))).push(line)
	}
	for (const trace of traces)
		assert.equal(expected.get(trace.name).length, trace.ops.length + 1, `${trace.name}: oracle line count`)
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
		case 'estimateGas':
			return { method: 'eth_estimateGas', params: rng.bool() ? [{ to: addr() }] : [{ to: addr() }, 'latest'] }
		case 'estimateGasInvalid':
			return { method: 'eth_estimateGas', params: [] }
		case 'sendTransactionInvalid':
			return { method: 'eth_sendTransaction', params: [] }
		case 'sendRawTransactionInvalid':
			return { method: 'eth_sendRawTransaction', params: [] }
		case 'unknown':
			return { method: 'eth_specUnknownMethod', params: [] }
		default:
			throw new Error(`unknown command ${kind}`)
	}
}

/** Raw payload ids start here, so a backend tells them apart from engine-issued ids. */
const RAW_ID_BASE = 1_000_000
const MALFORMED = ['{bad', '', 'not json', '[{"jsonrpc":"2.0"', ']', '{"jsonrpc":"2.0","id":1,']

/**
 * The raw JSON text an `rpc` operation sends, and the ids its answer must echo
 * (`null` for the single error object that answers an empty batch or malformed text).
 */
const toRawPayload = ([, shape, ...commands], rng, ids) => {
	const item = (command) => {
		// String and number ids are both legal JSON-RPC ids.
		const id = rng.bool() ? RAW_ID_BASE + ids.next++ : `raw-${ids.next++}`
		return { jsonrpc: '2.0', id, ...toRequest(command.split(' '), rng) }
	}
	if (shape === 'malformed') return { json: rng.pick(MALFORMED), echo: null }
	if (shape === 'single') {
		const request = item(commands[0])
		return { json: JSON.stringify(request), echo: request.id }
	}
	const batch = commands.map(item)
	return { json: JSON.stringify(batch), echo: batch.length === 0 ? null : batch.map(({ id }) => id) }
}

const renderResponse = (response) =>
	'error' in response ? `err:${response.error.code}` : `ok:${JSON.stringify(response.result)}`

/** Render a raw `rpc` answer in the oracle's notation, checking it echoes the request ids. */
const renderRaw = (text, echo) => {
	const answer = JSON.parse(text)
	if (Array.isArray(answer)) {
		assert.deepEqual(
			answer.map(({ id }) => id),
			echo,
			'batch answers echo the request ids in order',
		)
		return `batch:[${answer.map(renderResponse).join('|')}]`
	}
	assert.deepEqual(answer.id, echo, 'the answer echoes the request id')
	return `raw:${renderResponse(answer)}`
}

/**
 * Issue one operation on `engine` and render how it settles, in the oracle's notation.
 * `faults.ready` is the initialization error and `faults.close` the error the backend's
 * `close()` throws: a rejection is attributed by identity, never by message.
 * `observe` runs in the settling microtask, before the queue starts the next operation.
 */
const issue = (engine, op, rng, ids, faults, observe = (outcome) => outcome) => {
	const rejected = (error) => {
		if (error !== undefined && error === faults.ready) return 'init-failed'
		if (error !== undefined && error === faults.close) return 'close-failed'
		if (error?.message === 'engine is closed') return 'rejected:engine is closed'
		return error?.name === 'NativeRpcError' ? `err:${error.code}` : `rejected:${error?.message}`
	}
	const settle = (promise, resolved) =>
		promise.then(
			(value) => observe(resolved(value)),
			(error) => observe(rejected(error)),
		)
	if (op[0] === 'close') return settle(engine.close(), () => 'closed')
	if (op[0] === 'ready') return settle(engine.ready(), () => 'ready')
	if (op[0] === 'rpc') {
		const { json, echo } = toRawPayload(op, rng, ids)
		return settle(engine.rpc(json), (text) => renderRaw(text, echo))
	}
	return settle(engine.request(toRequest(op, rng)), (result) => `ok:${JSON.stringify(result)}`)
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
 * (A) The default native engine. It hides its backend, so the sent and backend-close
 * columns are not observable. State is read through the engine's own serialized queue.
 * Initialization fails through the one native call that rejects without network access:
 * a fork URL the node cannot parse.
 */
const runNative = async (trace, rng) => {
	const options = {}
	if (trace.consoleLog) options.consoleLog = () => {}
	if (trace.init === 'ok') options.mining = { auto: true }
	if (trace.init === 'fails') options.fork = { url: 'not a url' }
	const engine = createZevmEngine(options)
	let closeEvents = 0
	engine.events.on('close', () => closeEvents++)
	const faults = { ready: undefined, close: undefined }
	const ids = { next: 0 }
	// A state read is a typed request with fixed parameters.
	const issueOp = (op, observe) =>
		op[0] === 'read'
			? engine.request(op[1]).then(
					(result) => `ok:${JSON.stringify(result)}`,
					(error) => (error === faults.ready ? 'init-failed' : `rejected:${error?.message}`),
				)
			: issue(engine, op, rng, ids, faults, observe)
	const stateOf = (reads, label) => {
		if (reads.every((read) => read === 'rejected:engine is closed' || read === 'init-failed')) return '-'
		assert.ok(
			reads.every((read) => read.startsWith('ok:')),
			`${trace.name} ${label}: state read failed: ${reads.join(' ')}`,
		)
		return renderState(reads.map((read) => JSON.parse(read.slice(3))))
	}
	const pipelined = rng.bool(0.4)
	const pending = []
	try {
		// Initialization is first in the queue. The reads issued now run directly after it.
		const ready = engine.ready().then(
			() => ['ready', closeEvents],
			(error) => {
				faults.ready = error
				return ['init-failed', closeEvents]
			},
		)
		const initial = Promise.all([ready, Promise.all(STATE_READS.map((read) => issueOp(['read', read])))])
		if (!pipelined) await initial
		for (const op of trace.ops) {
			// `ready()` returns the initialization promise without joining the queue. Let the
			// queue drain first, so its observation is taken in issue order.
			if (op[0] === 'ready') await Promise.all(pending)
			const outcome = issueOp(op, (rendered) => [rendered, closeEvents])
			// Issued in the same tick as the operation: the queue runs them directly after it.
			const reads = Promise.all(STATE_READS.map((read) => issueOp(['read', read])))
			const step = Promise.all([outcome, reads])
			pending.push(step)
			if (!pipelined) await step
		}
		const [[readyOutcome, readyEvents], initialReads] = await initial
		const lines = [[trace.name, 'init', readyOutcome, readyEvents, stateOf(initialReads, 'init')].join('\t')]
		for (const [index, step] of pending.entries()) {
			const [[outcome, events], reads] = await step
			lines.push([trace.name, index, outcome, events, stateOf(reads, `step ${index}`)].join('\t'))
		}
		return lines
	} finally {
		await engine.close()
	}
}

/**
 * (B) A pluggable async WASM-style backend over an isolated native node. It records
 * every call the engine makes, so all oracle columns are observable, and it injects the
 * trace's faults:
 *   drain `fails`    `tevm_drainConsoleLogs` answers a non-`-32601` error, throws, or
 *                    answers text that is not a JSON-RPC response;
 *   init `fails`     the `evm_setAutomine` initialization call answers an error or throws;
 *   closeThrows      `close()` releases the node and then throws.
 */
const runPluggable = async (trace, rng) => {
	const node = new NativeNode({})
	const sent = []
	let closes = 0
	let closeEvents = 0
	let inFlight = 0
	let overlapped = false
	const faults = { ready: undefined, close: new Error('backend close failed') }
	const answer = (id, body) => JSON.stringify({ jsonrpc: '2.0', id, ...body })
	/** One engine-issued call. Raw payloads never reach this function. */
	const serve = (request, json) => {
		if (request.method === 'tevm_drainConsoleLogs') {
			sent.push(`${request.id}d`)
			if (trace.drain === 'supported') return answer(request.id, { result: [] })
			if (trace.drain === 'unsupported')
				return answer(request.id, { error: { code: -32601, message: 'Method not found' } })
			const fault = rng.int(4)
			if (fault === 0) return answer(request.id, { error: { code: -32000, message: 'drain failed' } })
			if (fault === 1) return answer(request.id, { error: { code: -32603, message: 'Internal error' } })
			if (fault === 2) return 'not a JSON-RPC response'
			throw new Error('drain transport fault')
		}
		sent.push(`${request.id}`)
		if (trace.init === 'fails' && request.method === 'evm_setAutomine') {
			if (rng.bool()) return answer(request.id, { error: { code: -32000, message: 'initialization rejected' } })
			throw new Error('initialization transport fault')
		}
		return node.rpc(json)
	}
	const backend = {
		rpc: async (json) => {
			if (inFlight++ > 0) overlapped = true
			try {
				await yieldRandomly(rng)
				let request
				try {
					request = JSON.parse(json)
				} catch {
					// Malformed text is a raw payload: the node owns the parse error.
				}
				const engineIssued =
					request !== null &&
					typeof request === 'object' &&
					!Array.isArray(request) &&
					typeof request.id === 'number' &&
					request.id < RAW_ID_BASE
				let response
				if (engineIssued) response = serve(request, json)
				else {
					sent.push('r')
					response = node.rpc(json)
				}
				await yieldRandomly(rng)
				return response
			} finally {
				inFlight--
			}
		},
		close: async () => {
			await yieldRandomly(rng)
			closes++
			node.close()
			if (trace.closeThrows) throw faults.close
		},
	}
	const options = { backend }
	if (trace.consoleLog) options.consoleLog = () => {}
	if (trace.init !== 'none') options.mining = { auto: true }
	const engine = createZevmEngine(options)
	engine.events.on('close', () => closeEvents++)
	const readState = () =>
		renderState(
			STATE_READS.map((read) => {
				const response = JSON.parse(node.rpc(JSON.stringify({ jsonrpc: '2.0', id: 0, ...read })))
				assert.ok('result' in response, `${trace.name}: state read failed: ${JSON.stringify(response)}`)
				return response.result
			}),
		)
	let consumed = 0
	/** The observation runs when the operation settles, before the queue starts the next one. */
	const observe = (step) => (outcome) => {
		const calls = sent.slice(consumed)
		consumed = sent.length
		const state = closes > 0 ? '-' : readState()
		return [trace.name, step, outcome, calls.length === 0 ? '-' : calls.join(','), closes, closeEvents, state].join(
			'\t',
		)
	}
	const ids = { next: 0 }
	const pipelined = rng.bool(0.4)
	try {
		const observeInit = observe('init')
		const pending = [
			engine.ready().then(
				() => observeInit('ready'),
				(error) => {
					faults.ready = error
					return observeInit('init-failed')
				},
			),
		]
		if (!pipelined) await pending[0]
		for (const [index, op] of trace.ops.entries()) {
			// `ready()` returns the initialization promise without joining the queue. Let the
			// queue drain first, so its observation is taken in issue order.
			if (op[0] === 'ready') await Promise.all(pending)
			const step = issue(engine, op, rng, ids, faults, observe(index))
			pending.push(step)
			if (!pipelined) await step
		}
		const lines = await Promise.all(pending)
		assert.equal(overlapped, false, `${trace.name}: the engine issued overlapping backend calls`)
		return lines
	} finally {
		await engine.close().catch(() => {})
		if (closes === 0) node.close()
	}
}

/** Keep the columns that engine (A) can observe. */
const nativeColumns = (line) => {
	const [name, index, outcome, , , closeEvents, state] = line.split('\t')
	return [name, index, outcome, closeEvents, state].join('\t')
}

const describeTrace = (trace) =>
	`consoleLog=${trace.consoleLog} drain=${trace.drain} init=${trace.init} closeThrows=${trace.closeThrows}`

/** Run every trace through `driver` and compare each line with the oracle. Returns the step count. */
const compare = async (traces, expected, driver, project, label) => {
	let steps = 0
	const queue = [...traces.entries()]
	const worker = async () => {
		for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
			const [index, trace] = item
			const observed = await driver(trace, prng(SEED ^ (0x9e3779b9 + index)))
			const want = expected.get(trace.name).map(project)
			// Line 0 is the settled initialization; line `n + 1` is operation `n`.
			for (let line = 0; line < want.length; line++) {
				if (observed[line] !== want[line]) {
					assert.fail(
						`${label} differs from the Lean oracle at ${trace.name} ${line === 0 ? 'init' : `step ${line - 1}`} (FUZZ_SEED=${SEED})\n` +
							`config:   ${describeTrace(trace)}\n` +
							`commands: ${trace.ops
								.slice(0, line)
								.map((op) => op.join(' '))
								.join(' | ')}\n` +
							`expected: ${want[line]}\nobserved: ${observed[line]}`,
					)
				}
			}
			steps += trace.ops.length
			assert.equal(observed.length, want.length, `${trace.name}: line count`)
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker))
	return steps
}

/** Compare traces with both live engines. Returns the step count of each. */
const compareBoth = async (traces) => {
	const native = await compare(traces, runOracle(traces.map(faultFree)), runNative, nativeColumns, 'native engine')
	const pluggable = await compare(traces, runOracle(traces), runPluggable, (line) => line, 'pluggable backend')
	return [native, pluggable]
}

// ---------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------

// Always an incremental `lake build`: an edited `.lean` file is never tested as a stale binary.
before(() => {
	oracle = buildOracle(here, 'engine-spec')
})

const rng = prng(SEED)
const traces = Array.from({ length: TRACES }, (_, index) => generateTrace(rng, `t${index}`))
let expected

test('the Lean oracle evaluates every generated trace', () => {
	assert.ok(TRACES >= 300 || process.env.FUZZ_TRACES !== undefined, 'the default corpus holds at least 300 traces')
	expected = runOracle(traces)
	const lines = [...expected.values()].flat()
	assert.ok(!lines.some((line) => line.includes('unmodeled')), 'the generator stays inside the model')
	// The corpus must reach every outcome class.
	const outcomes = new Set(lines.map((line) => line.split('\t')[2].replace(/"0x[0-9a-f]*"/g, 'hex')))
	for (const outcome of [
		'ok:true',
		'ok:false',
		'ok:hex',
		'err:-32602',
		'err:-32601',
		'raw:ok:true',
		'raw:ok:hex',
		'raw:err:-32602',
		'raw:err:-32600',
		'raw:err:-32700',
		'rejected:engine is closed',
		'init-failed',
		'ready',
		'closed',
		'close-failed',
	])
		assert.ok(outcomes.has(outcome), `corpus never produced ${outcome}`)
	assert.ok(
		[...outcomes].some((outcome) => outcome.startsWith('batch:[') && outcome.includes('|')),
		'corpus never produced a multi-request batch answer',
	)
	// Every command reaches the backend both through `request` and inside a raw payload.
	const typed = new Set(traces.flatMap((trace) => trace.ops.map((op) => op[0])))
	const raw = new Set(
		traces.flatMap((trace) =>
			trace.ops.filter((op) => op[0] === 'rpc').flatMap((op) => op.slice(2).map((command) => command.split(' ')[0])),
		),
	)
	for (const kind of COMMAND_KINDS) {
		assert.ok(typed.has(kind), `corpus never sends ${kind} through request`)
		assert.ok(raw.has(kind), `corpus never sends ${kind} through rpc`)
	}
	for (const kind of ['close', 'ready', 'rpc']) assert.ok(typed.has(kind), `corpus never issues ${kind}`)
	// Each backend behaviour of the drain is reached, and a failing drain is retried.
	const drainCalls = (trace) =>
		expected
			.get(trace.name)
			.flatMap((line) => line.split('\t')[3].split(','))
			.filter((call) => call.endsWith('d')).length
	const drains = Object.fromEntries(
		['supported', 'unsupported', 'fails'].map((mode) => [
			mode,
			traces.filter((trace) => trace.drain === mode).map(drainCalls),
		]),
	)
	assert.ok(
		drains.supported.some((count) => count > 1),
		'corpus drains a supporting backend repeatedly',
	)
	assert.ok(drains.unsupported.includes(1), 'corpus clears the latch on -32601')
	assert.ok(
		drains.unsupported.every((count) => count <= 1),
		'a cleared latch never drains again',
	)
	assert.ok(
		drains.fails.some((count) => count > 1),
		'corpus retries a failing drain',
	)
	const failedDrains = drains.fails.reduce((sum, count) => sum + count, 0)
	console.log(
		`oracle: ${traces.length} traces, ${lines.length - traces.length} steps, ` +
			`${Object.values(drains)
				.flat()
				.reduce((sum, count) => sum + count, 0)} drain calls ` +
			`(${failedDrains} failing), seed ${SEED}`,
	)
})

test('native ZEVM engine matches the Lean oracle at every step', async () => {
	const steps = await compare(traces, runOracle(traces.map(faultFree)), runNative, nativeColumns, 'native engine')
	console.log(`native: ${traces.length} traces, ${steps} steps identical`)
})

test('pluggable async WASM-style backend matches the Lean oracle at every step', async () => {
	const steps = await compare(traces, expected, runPluggable, (line) => line, 'pluggable backend')
	console.log(`pluggable: ${traces.length} traces, ${steps} steps identical`)
})

/** The `<outcome> <sent> <backend closes> <close events>` columns of one trace's lines. */
const observable = (lines) => lines.map((line) => line.split('\t').slice(2, 6).join(' '))

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
		['supported', 'unsupported'].map((drain) => ({
			name: `d${+consoleLog}${drain}`,
			consoleLog,
			drain,
			init: 'none',
			closeThrows: false,
			ops,
		})),
	)
	// Line 0 is `init`, so operation `n` is line `n + 1`.
	assert.deepEqual(observable(runOracle(directed).get('d1unsupported')).slice(9, 23), [
		'ok:true 9 0 0',
		'ok:false 10 0 0',
		'ok:false 11 0 0',
		'ok:"0x4" 12 0 0',
		'ok:"0x" 13,14d 0 0',
		'err:-32602 15 0 0',
		'ok:"0x" 16 0 0',
		'ok:true 17 0 0',
		'ok:false 18 0 0',
		'closed - 1 1',
		'closed - 1 1',
		'rejected:engine is closed - 1 1',
		'rejected:engine is closed - 1 1',
		'closed - 1 1',
	])
	assert.deepEqual(await compareBoth(directed), [4 * ops.length, 4 * ops.length])
})

test('directed trace: all four code-executing methods drain, through request and rpc', async () => {
	const target = q(CALL_TARGETS[0])
	const ops = [
		['call', target],
		['estimateGas', target],
		['sendTransactionInvalid'],
		['sendRawTransactionInvalid'],
		['blockNumber'], // not code-executing: no drain
		['rpc', 'single', `call ${target}`],
		['rpc', 'single', `estimateGas ${target}`],
		['rpc', 'single', 'sendTransactionInvalid'],
		['rpc', 'single', 'sendRawTransactionInvalid'],
		['rpc', 'single', 'blockNumber'], // no drain
		['rpc', 'batch', 'blockNumber', 'sendRawTransactionInvalid', `call ${target}`], // one drain per payload
		['rpc', 'batch', 'blockNumber', 'unknown'], // no drain
		['rpc', 'batch'], // empty batch: Invalid Request, no drain
		['rpc', 'malformed'], // Parse error, no drain
	]
	const trace = (drain) => ({ name: `m${drain}`, consoleLog: true, drain, init: 'none', closeThrows: false, ops })
	const directed = [trace('supported'), trace('unsupported')]
	const want = runOracle(directed)
	assert.deepEqual(observable(want.get('msupported')).slice(1), [
		'ok:"0x" 1,2d 0 0',
		'ok:"0x5208" 3,4d 0 0',
		'err:-32602 5,6d 0 0',
		'err:-32602 7,8d 0 0',
		'ok:"0x0" 9 0 0',
		'raw:ok:"0x" r,10d 0 0',
		'raw:ok:"0x5208" r,11d 0 0',
		'raw:err:-32602 r,12d 0 0',
		'raw:err:-32602 r,13d 0 0',
		'raw:ok:"0x0" r 0 0',
		'batch:[ok:"0x0"|err:-32602|ok:"0x"] r,14d 0 0',
		'batch:[ok:"0x0"|err:-32601] r 0 0',
		'raw:err:-32600 r 0 0',
		'raw:err:-32700 r 0 0',
	])
	// `-32601` clears the latch after the first drain, for request and rpc alike.
	assert.deepEqual(
		observable(want.get('munsupported'))
			.slice(1)
			.map((line) => line.split(' ')[1]),
		['1,2d', '3', '4', '5', '6', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
	)
	// Every code-executing method is sent both through `request` and inside a raw payload.
	for (const [method, kinds] of Object.entries(CODE_EXECUTING)) {
		assert.ok(
			ops.some((op) => kinds.includes(op[0])),
			`directed trace sends ${method} through request`,
		)
		assert.ok(
			ops.some((op) => op[0] === 'rpc' && op.slice(2).some((command) => kinds.includes(command.split(' ')[0]))),
			`directed trace sends ${method} through rpc`,
		)
	}
	assert.deepEqual(await compareBoth(directed), [2 * ops.length, 2 * ops.length])
})

test('directed trace: a drain error never replaces a committed RPC result', async () => {
	const a = q(ADDRS[0])
	const target = q(CALL_TARGETS[0])
	const ops = [
		['setBalance', a, '0x7'],
		['call', target],
		['estimateGas', target],
		['sendTransactionInvalid'],
		['sendRawTransactionInvalid'],
		['callInvalid'],
		['estimateGasInvalid'],
		['rpc', 'single', `call ${target}`],
		['rpc', 'batch', `setBalance ${a} 0x9`, `call ${target}`, 'sendRawTransactionInvalid'],
		['getBalance', a], // the batch committed its write although its drain failed
		['close'],
	]
	const directed = [{ name: 'f', consoleLog: true, drain: 'fails', init: 'none', closeThrows: false, ops }]
	// The drain fails after every code-executing step. Each step still settles with the
	// backend's own answer, and the latch stays armed: the next step drains again.
	assert.deepEqual(observable(runOracle(directed).get('f')).slice(1), [
		'ok:true 1 0 0',
		'ok:"0x" 2,3d 0 0',
		'ok:"0x5208" 4,5d 0 0',
		'err:-32602 6,7d 0 0',
		'err:-32602 8,9d 0 0',
		'err:-32602 10,11d 0 0',
		'err:-32602 12,13d 0 0',
		'raw:ok:"0x" r,14d 0 0',
		'batch:[ok:true|ok:"0x"|err:-32602] r,15d 0 0',
		'ok:"0x9" 16 0 0',
		'closed - 1 1',
	])
	assert.deepEqual(await compareBoth(directed), [ops.length, ops.length])
})

test('directed trace: a failed initialization closes the backend and emits close', async () => {
	const ops = [
		['ready'],
		['blockNumber'],
		['rpc', 'single', 'blockNumber'],
		['rpc', 'malformed'],
		['close'],
		['close'],
		['ready'],
		['snapshot'],
	]
	const directed = [false, true].map((closeThrows) => ({
		name: `i${+closeThrows}`,
		consoleLog: true,
		drain: 'supported',
		init: 'fails',
		closeThrows,
		ops,
	}))
	const want = runOracle(directed)
	// A throwing `backend.close()` during a failed initialization changes nothing:
	// the initialization error is the one callers see.
	for (const trace of directed)
		assert.deepEqual(observable(want.get(trace.name)), [
			'init-failed 1 1 1',
			'init-failed - 1 1',
			'init-failed - 1 1',
			'init-failed - 1 1',
			'init-failed - 1 1',
			'closed - 1 1',
			'closed - 1 1',
			'init-failed - 1 1',
			'init-failed - 1 1',
		])
	assert.deepEqual(await compareBoth(directed), [2 * ops.length, 2 * ops.length])
})

test('directed trace: close is idempotent when backend.close() throws', async () => {
	const a = q(ADDRS[0])
	const ops = [
		['setBalance', a, '0x5'],
		['ready'],
		['close'], // rejects with the backend error; the engine is closed
		['close'], // resolves; the backend is not closed again
		['blockNumber'],
		['rpc', 'single', 'blockNumber'],
		['ready'], // initialization succeeded, so `ready` still resolves
		['close'],
	]
	const directed = ['none', 'ok'].map((init) => ({
		name: `c${init}`,
		consoleLog: false,
		drain: 'supported',
		init,
		closeThrows: true,
		ops,
	}))
	const want = runOracle(directed)
	assert.deepEqual(observable(want.get('cok')), [
		'ready 1 0 0',
		'ok:true 2 0 0',
		'ready - 0 0',
		'close-failed - 1 1',
		'closed - 1 1',
		'rejected:engine is closed - 1 1',
		'rejected:engine is closed - 1 1',
		'ready - 1 1',
		'closed - 1 1',
	])
	assert.equal(observable(want.get('cnone'))[0], 'ready - 0 0')
	assert.deepEqual(await compareBoth(directed), [2 * ops.length, 2 * ops.length])
})

// UPSTREAM-DELTA(zevm: `NodeRuntime.replayStateToBlock`, src/node/runtime.zig), outside the
// modeled `latest` surface. ZEVM rebuilds historical state by replaying block transactions,
// so a block mined after `anvil_setBalance` reports the balance from before the edit. Anvil
// and Hardhat report the edited balance. `latest`, the tip block and genesis are exact and
// asserted as such. The one wrong answer is pinned to its exact current value: when ZEVM
// fixes the replay, this test fails and `KNOWN_DELTA` must be replaced by `NORMATIVE`.
test('historical eth_getBalance: tip and genesis are exact; the pre-tip dev-RPC edit is a pinned ZEVM delta', async () => {
	const NORMATIVE = '0x10'
	const KNOWN_DELTA = '0x0'
	const engine = createZevmEngine()
	try {
		const a = address(ADDRS[0])
		const balanceAt = (block) => engine.request({ method: 'eth_getBalance', params: [a, block] })
		await engine.request({ method: 'anvil_setBalance', params: [a, NORMATIVE] })
		await engine.request({ method: 'evm_mine', params: [] })
		await engine.request({ method: 'anvil_setBalance', params: [a, '0x20'] })
		await engine.request({ method: 'evm_mine', params: [] })
		assert.equal(await engine.request({ method: 'eth_blockNumber', params: [] }), '0x2')
		assert.equal(await balanceAt('latest'), '0x20')
		assert.equal(await balanceAt('0x2'), '0x20')
		assert.equal(await balanceAt('0x0'), '0x0')
		assert.equal(
			await balanceAt('0x1'),
			KNOWN_DELTA,
			`ZEVM's historical replay changed. If block 0x1 now reports ${NORMATIVE}, the upstream defect is fixed: assert NORMATIVE here and delete KNOWN_DELTA.`,
		)
	} finally {
		await engine.close()
	}
})
