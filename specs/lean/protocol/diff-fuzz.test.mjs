// Differential fuzz: Lean 4 reference spec (`protocol-spec`) versus the live
// implementations of Fusaka protocol math.
//
//   Voltaire TS  CLZ handler, ModExp gas and precompile, blob fee market,
//                blob schedules, EIP-7934 size check
//   TEVM native  `createZevmEngine` (ZEVM + Guillotine Mini): CLZ opcode,
//                ModExp precompile exact gas and output, EIP-7825 admission
//
// Every case is one line of the Lean oracle's stdin. The whole batch runs in a
// single Lean process, then each answer must equal the implementation's
// answer as an exact string.
//
//   node --test specs/lean/protocol/diff-fuzz.test.mjs
//   PROTOCOL_FUZZ_SEED=123 node --test specs/lean/protocol/diff-fuzz.test.mjs
//   PROTOCOL_FUZZ_DUMP=/tmp/queries.tsv node --test specs/lean/protocol/diff-fuzz.test.mjs
//
// Voltaire is read from VOLTAIRE_DIR (default `../voltaire` beside this repository).
// See ../oracle.mjs for LEAN_SKIP_BUILD and ELAN_HOME.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildOracle, REPO_ROOT as REPO, VOLTAIRE_TS } from '../oracle.mjs'

const HERE = import.meta.dirname
const VOLTAIRE = join(VOLTAIRE_TS, 'src')
/** Path of the compiled oracle, set by the `before` hook's incremental `lake build`. */
let ORACLE
const SEED = Number(process.env.PROTOCOL_FUZZ_SEED ?? 0x7e5a0ca)

// Both targets are loaded from source, with no build step:
// - Voltaire's `.js` specifiers that name `.ts` files resolve to them, and its
//   one string `enum` becomes a plain object so Node can strip the types.
// - `@tevm/utils` has no `dist` in a source checkout; `createZevmEngine` needs
//   only its `decodeHardhatConsoleLog` export, so resolve to that module.
registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '@tevm/utils') {
			return {
				url: pathToFileURL(join(REPO, 'packages/utils/src/decodeHardhatConsoleLog.js')).href,
				shortCircuit: true,
			}
		}
		if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
			const url = new URL(specifier, context.parentURL)
			if (!existsSync(fileURLToPath(url))) {
				const ts = new URL(url.href.replace(/\.js$/, '.ts'))
				if (existsSync(fileURLToPath(ts))) return { url: ts.href, shortCircuit: true }
			}
		}
		return next(specifier, context)
	},
	load(url, context, next) {
		if (!url.endsWith('.ts') || !url.startsWith(pathToFileURL(VOLTAIRE).href)) return next(url, context)
		const source = readFileSync(fileURLToPath(url), 'utf8').replace(
			/export enum (\w+) \{([^}]*)\}/g,
			(_, name, body) => `export const ${name} = {${body.replace(/(\w+)\s*=/g, '$1:')}}`,
		)
		return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(source) }
	},
})

const voltaire = (path) => import(pathToFileURL(join(VOLTAIRE, path)).href)

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

/** @param {number} seed */
const mulberry32 = (seed) => {
	let a = seed | 0
	return () => {
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return (t ^ (t >>> 14)) >>> 0
	}
}
const u32 = mulberry32(SEED)
/** Uniform integer in `[0, n)`. */
const int = (n) => u32() % n
/** Uniform integer in `[lo, hi]`. */
const range = (lo, hi) => lo + int(hi - lo + 1)
const pick = (items) => items[int(items.length)]
/** Exactly `bits` random bits. */
const bits = (n) => {
	let value = 0n
	for (let left = n; left > 0; left -= 32) {
		const take = Math.min(32, left)
		value = (value << BigInt(take)) | BigInt(u32() >>> (32 - take))
	}
	return value
}
/** Random value of a random width up to `maxBits`. */
const big = (maxBits) => bits(int(maxBits + 1))
/** Uniform bigint in `[0, n)`. */
const below = (n) => (n <= 0n ? 0n : bits(n.toString(2).length + 16) % n)
const randomBytes = (n) => Uint8Array.from({ length: n }, () => int(256))

const hex = (value) => `0x${value.toString(16)}`
const bytesToHex = (bytes) => `0x${Buffer.from(bytes).toString('hex')}`
const word = (value) => BigInt(value).toString(16).padStart(64, '0')

// ---------------------------------------------------------------------------
// Constants shared by generators (inputs only; expected values come from Lean)
// ---------------------------------------------------------------------------

const FORKS = ['berlin', 'london', 'merge', 'shanghai', 'cancun', 'prague', 'osaka', 'amsterdam']
const OSAKA_TIMESTAMP = 1764798551
const TIMESTAMPS = [1710338135, 1746612311, OSAKA_TIMESTAMP, 1765290071, 1767747671]
const TX_GAS_CAP = 16777216
const MAX_RLP_BLOCK_SIZE = 8388608
const GAS_PER_BLOB = 131072n
const NAMED_SCHEDULES = [
	{ target: 3n, max: 6n, baseFeeUpdateFraction: 3338477n },
	{ target: 6n, max: 9n, baseFeeUpdateFraction: 5007716n },
	{ target: 10n, max: 15n, baseFeeUpdateFraction: 8346193n },
	{ target: 14n, max: 21n, baseFeeUpdateFraction: 11684671n },
]

/** @type {{category: string, query: string, actual: string}[]} */
const cases = []
/** @type {Map<string, {total: number, mismatches: string[]}>} */
const report = new Map()
const engines = []

/** Record one differential case: `query` for Lean, `actual` from the implementation. */
const add = (category, fields, actual) => cases.push({ category, query: fields.join('\t'), actual: String(actual) })

const randomWord = () => {
	switch (int(7)) {
		case 0:
			return pick([0n, 1n, 2n, (1n << 256n) - 1n, 1n << 255n, (1n << 255n) - 1n])
		case 1:
			return 1n << BigInt(int(256))
		case 2:
			return (1n << BigInt(range(1, 256))) - 1n
		case 3: {
			const top = int(256)
			return (1n << BigInt(top)) | bits(top)
		}
		case 4:
			return bits(256)
		default:
			return big(256)
	}
}

// ---------------------------------------------------------------------------
// ModExp inputs
// ---------------------------------------------------------------------------

/** EIP-198 calldata: three length words then the operand bytes. */
const modexpInput = (baseLen, expLen, modLen, data) => {
	const input = new Uint8Array(96 + data.length)
	input.set(Buffer.from(word(baseLen) + word(expLen) + word(modLen), 'hex'))
	input.set(data, 96)
	return input
}

/** @param {number} maxLen Largest operand length. @param {number} maxExpLen Largest exponent length. */
const randomModexpInput = (maxLen, maxExpLen) => {
	if (int(8) === 0) {
		// Header only: operands are implicit zero padding. Probes EIP-7823's 1024-byte edge.
		const lens = [range(0, 32), range(0, 32), range(0, 32)]
		lens[int(3)] = pick([1023, 1024, 1025, 1026])
		return modexpInput(lens[0], lens[1], lens[2], new Uint8Array())
	}
	const baseLen = int(4) === 0 ? range(0, 4) : range(0, maxLen)
	const expLen = pick([0, 1, 2, 31, 32, 33, range(0, maxExpLen), range(0, maxExpLen)])
	const modLen = int(6) === 0 ? range(0, 2) : range(0, maxLen)
	const base = randomBytes(baseLen)
	const exp = randomBytes(expLen)
	const mod = randomBytes(modLen)
	if (int(4) === 0) exp.fill(0, 0, int(expLen + 1)) // leading zero bytes move the head bit
	if (int(12) === 0) exp.fill(0)
	if (int(12) === 0) mod.fill(0)
	if (int(12) === 0 && modLen > 0) mod.fill(0).set([1], modLen - 1)
	if (int(12) === 0) base.fill(0)
	let data = Uint8Array.from([...base, ...exp, ...mod])
	// Truncated calldata is zero-padded on the right; trailing bytes are ignored.
	if (int(6) === 0) data = data.subarray(0, int(data.length + 1))
	else if (int(10) === 0) data = Uint8Array.from([...data, ...randomBytes(range(1, 40))])
	return modexpInput(baseLen, expLen, modLen, data)
}

// ---------------------------------------------------------------------------
// Voltaire TypeScript
// ---------------------------------------------------------------------------

const fuzzVoltaire = async () => {
	const clz = await voltaire('evm/bitwise/0x1e_CLZ.js')
	const { calculateModExpCost } = await voltaire('primitives/GasConstants/Precompile.js')
	const { TxGasLimitOsaka } = await voltaire('primitives/GasConstants/constants.js')
	const { modexp } = await voltaire('evm/precompiles/precompiles.ts')
	const { fakeExponential } = await voltaire('primitives/FeeMarket/fakeExponential.js')
	const { calculateBlobBaseFee } = await voltaire('primitives/FeeMarket/calculateBlobBaseFee.js')
	const { calculateExcessBlobGas, calculateExcessBlobGasEip7918 } = await voltaire(
		'primitives/FeeMarket/calculateExcessBlobGas.js',
	)
	const { blobScheduleForTimestamp } = await voltaire('primitives/FeeMarket/getBlobSchedule.js')
	const { exceedsMaxRlpBlockSize } = await voltaire('primitives/Rlp/exceedsMaxRlpBlockSize.js')

	assert.equal(TxGasLimitOsaka, BigInt(TX_GAS_CAP))

	// EIP-7939 CLZ handler, fork-gated.
	for (let i = 0; i < 400; i++) {
		const fork = int(3) === 0 ? pick(FORKS) : pick(['osaka', 'amsterdam', 'prague'])
		const value = randomWord()
		const frame = { hardfork: fork, gasRemaining: 100n, stack: [value], pc: 0 }
		const error = clz.handle(frame)
		let actual
		if (error === null) {
			assert.deepEqual([frame.gasRemaining, frame.pc, frame.stack.length], [95n, 1, 1])
			actual = frame.stack[0]
		} else {
			actual = error.type === 'InvalidOpcode' ? 'invalid' : `unexpected:${error.type}`
		}
		add('voltaire/clz', ['opclz', fork, hex(value)], actual)
	}

	// EIP-7934 block size check on real byte arrays.
	const block = new Uint8Array(MAX_RLP_BLOCK_SIZE + 65537)
	for (let i = 0; i < 100; i++) {
		const size = int(3) === 0 ? int(block.length + 1) : MAX_RLP_BLOCK_SIZE + range(-40, 40)
		add('voltaire/blocksize', ['blocksize', 'osaka', size], exceedsMaxRlpBlockSize(block.subarray(0, size)) ? 0 : 1)
	}

	// EIP-4844 fake_exponential. `factor >= 1`: see the `factor = 0` test below.
	for (let i = 0; i < 300; i++) {
		const factor = 1n + big(64)
		const denominator = 1n + big(40)
		const numerator =
			// numerator / denominator stays below 300, so the series has at most ~900 terms.
			int(5) === 0 ? below(denominator * 3n) : denominator * BigInt(int(int(4) === 0 ? 300 : 40)) + below(denominator)
		add(
			'voltaire/fakeexp',
			['fakeexp', factor, numerator, denominator],
			fakeExponential(factor, numerator, denominator),
		)
	}
	for (let i = 0; i < 100; i++) {
		const fraction = pick(NAMED_SCHEDULES).baseFeeUpdateFraction
		const excess = int(6) === 0 ? 0n : below(fraction * BigInt(range(1, 120)))
		add('voltaire/blobfee', ['blobfee', excess, fraction], calculateBlobBaseFee(excess, fraction))
	}

	// EIP-7892 schedule lookup.
	for (let i = 0; i < 100; i++) {
		const timestamp = int(4) === 0 ? range(0, 1900000000) : pick(TIMESTAMPS) + range(-3, 3)
		let actual = 'none'
		try {
			const schedule = blobScheduleForTimestamp(BigInt(timestamp))
			actual = `${schedule.target} ${schedule.max} ${schedule.baseFeeUpdateFraction}`
		} catch {}
		add('voltaire/schedule', ['schedule', timestamp], actual)
	}

	// EIP-4844 / EIP-7918 excess blob gas. Base fees cluster on the reserve
	// boundary `BLOB_BASE_COST * baseFee = GAS_PER_BLOB * blobFee` (ratio 16).
	const parents = (schedule) => {
		const excess = int(5) === 0 ? 0n : below(schedule.baseFeeUpdateFraction * BigInt(range(1, 45)))
		const used =
			int(5) === 0 ? below(GAS_PER_BLOB * (schedule.max + 2n)) : GAS_PER_BLOB * BigInt(int(Number(schedule.max) + 1))
		const boundary = 16n * calculateBlobBaseFee(excess, schedule.baseFeeUpdateFraction)
		const baseFee = pick([boundary - 1n, boundary, boundary + 1n, boundary + big(12), big(40), big(70), 0n, 1n, 7n])
		return [excess, used, baseFee < 0n ? 0n : baseFee]
	}
	for (let i = 0; i < 250; i++) {
		let schedule = pick(NAMED_SCHEDULES)
		if (int(2) === 0) {
			const max = BigInt(range(1, 64))
			schedule = { target: below(max + 1n), max, baseFeeUpdateFraction: 1n + big(26) }
		}
		const [excess, used, baseFee] = parents(schedule)
		add(
			'voltaire/excess-eip7918',
			['excess', 'osaka', schedule.target, schedule.max, schedule.baseFeeUpdateFraction, excess, used, baseFee],
			calculateExcessBlobGasEip7918(excess, used, baseFee, schedule),
		)
	}
	for (let i = 0; i < 150; i++) {
		const fork = pick(['cancun', 'prague', 'osaka'])
		const schedule = NAMED_SCHEDULES[fork === 'cancun' ? 0 : 1]
		const [excess, used, baseFee] = parents(schedule)
		add(
			'voltaire/excess-hardfork',
			['excess', fork, schedule.target, schedule.max, schedule.baseFeeUpdateFraction, excess, used, baseFee],
			calculateExcessBlobGas(excess, used, { hardfork: fork, parentBaseFeePerGas: baseFee }),
		)
	}
	for (let i = 0; i < 150; i++) {
		const timestamp = int(5) === 0 ? range(1700000000, 1800000000) : pick(TIMESTAMPS) + range(-2, 2)
		let schedule = NAMED_SCHEDULES[0]
		try {
			schedule = blobScheduleForTimestamp(BigInt(timestamp))
		} catch {}
		const [excess, used, baseFee] = parents(schedule)
		let actual = 'none'
		try {
			actual = calculateExcessBlobGas(excess, used, { timestamp: BigInt(timestamp), parentBaseFeePerGas: baseFee })
		} catch {}
		add('voltaire/excess-timestamp', ['excessat', timestamp, excess, used, baseFee], actual)
	}

	// EIP-2565 / EIP-7883 gas formula over the full length domain.
	const length = () => {
		switch (int(5)) {
			case 0:
				return BigInt(range(0, 40))
			case 1:
				return BigInt(range(0, 1100))
			case 2:
				return BigInt(pick([0, 1, 31, 32, 33, 63, 64, 65, 1023, 1024, 1025]))
			case 3:
				return big(64)
			default:
				return BigInt(range(0, 300))
		}
	}
	for (let i = 0; i < 500; i++) {
		const fork = pick(FORKS)
		const [baseLen, expLen, modLen] = [length(), length(), length()]
		const headBits = expLen < 32n ? Number(expLen) * 8 : 256
		const expHead = pick([0n, 1n, bits(headBits), big(headBits), big(headBits)])
		add(
			'voltaire/modexp-gas',
			['modexpgas', fork, baseLen, expLen, modLen, hex(expHead)],
			calculateModExpCost(baseLen, expLen, modLen, expHead, fork),
		)
	}

	// Full precompile: bounds, gas, output bytes, and the exact out-of-gas edge.
	for (let i = 0; i < 300; i++) {
		const fork = int(3) === 0 ? pick(FORKS) : pick(['osaka', 'prague'])
		const input = int(10) === 0 ? randomModexpInput(1024, 64) : randomModexpInput(160, 80)
		const result = modexp(input, 1n << 62n, fork)
		let actual = 'halt'
		if (result.success) {
			actual = `ok ${result.gasUsed} ${bytesToHex(result.output)}`
			if (modexp(input, result.gasUsed - 1n, fork).success) actual = `succeeds below gas ${result.gasUsed}`
			if (!modexp(input, result.gasUsed, fork).success) actual = `fails at gas ${result.gasUsed}`
		}
		add('voltaire/modexp-precompile', ['modexp', fork, bytesToHex(input)], actual)
	}
}

// ---------------------------------------------------------------------------
// TEVM native engine (createZevmEngine -> ZEVM NodeRuntime -> Guillotine Mini)
// ---------------------------------------------------------------------------

const CLZ_ADDRESS = '0x00000000000000000000000000000000000c1200'
const MODEXP_ADDRESS = '0x00000000000000000000000000000000000e0500'
// CALLDATALOAD(0); CLZ; MSTORE(0); RETURN(0, 32)
const CLZ_CODE = '0x6000351e60005260206000f3'
// calldata = gas word ++ ModExp input. STATICCALL 0x05 with exactly that gas,
// then return the success word followed by the precompile's return data.
const MODEXP_CODE = `0x${[
	'6020360380', // size = CALLDATASIZE - 32
	'6020600037', // CALLDATACOPY(0, 32, size)
	'6000600082600060056000', // retSize, retOffset, size, argsOffset, address 5, offset of gas word
	'35fa', // gas = CALLDATALOAD(0); STATICCALL
	'60005250', // MSTORE(0, success); POP size
	'3d600060203e', // RETURNDATACOPY(32, 0, RETURNDATASIZE)
	'3d60200160', // RETURNDATASIZE + 32
	'00f3', // RETURN(0, RETURNDATASIZE + 32)
].join('')}`
const MODEXP_GAS_CEILING = 12_000_000

const fuzzEngine = async () => {
	const { createZevmEngine } = await import(pathToFileURL(join(REPO, 'packages/node/src/createZevmEngine.js')).href)
	const boot = async (timestamp) => {
		const engine = createZevmEngine({ chainId: 1, mining: { auto: false } })
		engines.push(engine)
		await engine.request({ method: 'anvil_setCode', params: [CLZ_ADDRESS, CLZ_CODE] })
		await engine.request({ method: 'anvil_setCode', params: [MODEXP_ADDRESS, MODEXP_CODE] })
		await engine.request({ method: 'evm_setNextBlockTimestamp', params: [hex(timestamp)] })
		const accounts = await engine.request({ method: 'eth_accounts' })
		return { engine, from: accounts[0] }
	}
	// chainId 1 follows the mainnet schedule: Prague one second before Osaka.
	const nodes = { prague: await boot(OSAKA_TIMESTAMP - 1), osaka: await boot(OSAKA_TIMESTAMP) }
	let id = 0
	const rpc = async (fork, method, params) =>
		JSON.parse(await nodes[fork].engine.rpc(JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params })))

	// EIP-7939: CLZ executed by the EVM.
	for (let i = 0; i < 300; i++) {
		const fork = int(6) === 0 ? 'prague' : 'osaka'
		const value = randomWord()
		const response = await rpc(fork, 'eth_call', [{ to: CLZ_ADDRESS, data: `0x${word(value)}` }, 'pending'])
		let actual
		if (response.error === undefined) actual = BigInt(response.result)
		else if (response.error.code === 3) actual = 'invalid'
		else actual = `unexpected:${JSON.stringify(response.error)}`
		add('engine/clz', ['opclz', fork, hex(value)], actual)
	}

	// EIP-7825: transaction admission. Signing runs the same gas-limit check as
	// submission and leaves the pool empty, so every case sees identical state.
	for (let i = 0; i < 300; i++) {
		const fork = int(3) === 0 ? 'prague' : 'osaka'
		const gas = pick([
			TX_GAS_CAP + range(-4, 4),
			TX_GAS_CAP + range(-4, 4),
			range(21000, 30_000_000),
			2 ** range(15, 24) + range(-1, 1),
		])
		const method = pick(['eth_signTransaction', 'eth_signTransaction', 'eth_sendTransaction'])
		const response = await rpc(fork, method, [{ from: nodes[fork].from, to: CLZ_ADDRESS, gas: hex(gas) }])
		let actual
		if (typeof response.result === 'string') {
			actual = 1
			// A queued transaction would shift the next nonce; keep the pool empty.
			if (method === 'eth_sendTransaction') await rpc(fork, 'anvil_dropAllTransactions', [])
		} else if (
			response.error?.code === -32000 &&
			response.error.message === 'transaction gas limit exceeds Osaka cap (16777216)'
		) {
			actual = 0
		} else actual = `unexpected:${JSON.stringify(response)}`
		add('engine/tx-gas-cap', ['txgas', fork, gas], actual)
	}

	// EIP-7823 / EIP-7883: the precompile through a real STATICCALL. The engine
	// reports no gas figure, so find the least forwarded gas that succeeds.
	const callModexp = async (fork, input, gas) => {
		const response = await rpc(fork, 'eth_call', [
			{ to: MODEXP_ADDRESS, data: `0x${word(gas)}${Buffer.from(input).toString('hex')}`, gas: hex(16_000_000) },
			'pending',
		])
		if (response.error !== undefined) throw new Error(`ModExp caller failed: ${JSON.stringify(response.error)}`)
		return { success: BigInt(response.result.slice(0, 66)) === 1n, output: `0x${response.result.slice(66)}` }
	}
	for (let i = 0; i < 250; i++) {
		const fork = int(3) === 0 ? 'prague' : 'osaka'
		const input = randomModexpInput(96, 40)
		let actual = 'halt'
		const top = await callModexp(fork, input, MODEXP_GAS_CEILING)
		if (top.success) {
			let low = 0
			let high = MODEXP_GAS_CEILING
			while (low < high) {
				const middle = Math.floor((low + high) / 2)
				if ((await callModexp(fork, input, middle)).success) high = middle
				else low = middle + 1
			}
			actual = `ok ${low} ${(await callModexp(fork, input, low)).output}`
		}
		add('engine/modexp-precompile', ['modexp', fork, bytesToHex(input)], actual)
	}
}

// ---------------------------------------------------------------------------
// Lean oracle
// ---------------------------------------------------------------------------

const runOracle = (queries) => {
	const result = spawnSync(ORACLE, [], { input: `${queries.join('\n')}\n`, encoding: 'utf8', maxBuffer: 1 << 28 })
	assert.equal(result.status, 0, `protocol-spec exited ${result.status}: ${result.stderr}`)
	const answers = result.stdout.split('\n')
	assert.equal(answers.pop(), '')
	assert.equal(answers.length, queries.length, 'one answer per query')
	return answers
}

before(async () => {
	// Always an incremental `lake build`: an edited `.lean` file is never tested as a stale binary.
	ORACLE = buildOracle(HERE, 'protocol-spec')

	await fuzzVoltaire()
	await fuzzEngine()

	// Keep the exact batch for replay: `protocol-spec < file`.
	if (process.env.PROTOCOL_FUZZ_DUMP) {
		writeFileSync(process.env.PROTOCOL_FUZZ_DUMP, `${cases.map(({ query }) => query).join('\n')}\n`)
	}
	const started = performance.now()
	const answers = runOracle(cases.map(({ query }) => query))
	const elapsed = (performance.now() - started).toFixed(0)
	for (const [index, { category, query, actual }] of cases.entries()) {
		const entry = report.get(category) ?? { total: 0, mismatches: [] }
		report.set(category, entry)
		entry.total++
		if (answers[index] !== actual) {
			entry.mismatches.push(`${query.replaceAll('\t', ' ')}\n    lean: ${answers[index]}\n    impl: ${actual}`)
		}
	}
	console.log(`seed ${SEED}: ${cases.length} cases answered by one Lean process in ${elapsed} ms`)
	for (const [category, { total, mismatches }] of report) {
		console.log(`  ${category.padEnd(28)} ${String(total).padStart(4)} cases  ${mismatches.length} mismatches`)
	}
})

after(async () => {
	await Promise.all(engines.map((engine) => engine.close()))
})

const CATEGORIES = [
	'voltaire/clz',
	'voltaire/blocksize',
	'voltaire/fakeexp',
	'voltaire/blobfee',
	'voltaire/schedule',
	'voltaire/excess-eip7918',
	'voltaire/excess-hardfork',
	'voltaire/excess-timestamp',
	'voltaire/modexp-gas',
	'voltaire/modexp-precompile',
	'engine/clz',
	'engine/tx-gas-cap',
	'engine/modexp-precompile',
]

for (const category of CATEGORIES) {
	test(`Lean spec agrees with ${category}`, () => {
		const entry = report.get(category)
		assert.ok(entry && entry.total >= 100, `${category} ran ${entry?.total ?? 0} cases`)
		assert.equal(
			entry.mismatches.length,
			0,
			`${entry.mismatches.length}/${entry.total} mismatches:\n${entry.mismatches.slice(0, 5).join('\n')}`,
		)
	})
}

test('at least 2,000 randomized cases ran against both sides', () => {
	assert.deepEqual([...report.keys()].sort(), [...CATEGORIES].sort())
	assert.ok(cases.length >= 2000, `only ${cases.length} cases`)
})

test('oracle answers the normative EIP vectors', () => {
	const vectors = [
		['clz\t0', '256'], // EIP-7939
		['clz\t0x8000000000000000000000000000000000000000000000000000000000000000', '0'],
		['clz\t0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '0'],
		['clz\t0x4000000000000000000000000000000000000000000000000000000000000000', '1'],
		['clz\t1', '255'],
		['opclz\tprague\t1', 'invalid'],
		['txgas\tosaka\t16777216', '1'], // EIP-7825
		['txgas\tosaka\t16777217', '0'],
		['txgas\tprague\t30000000', '1'],
		['blocksize\tosaka\t8388608', '1'], // EIP-7934
		['blocksize\tosaka\t8388609', '0'],
		['blocksize\tprague\t8388609', '1'],
		['fakeexp\t1\t0\t5007716', '1'], // EIP-4844
		['schedule\t1765290071', '10 15 8346193'], // EIP-7892 BPO1
		['schedule\t1767747671', '14 21 11684671'], // EIP-7892 BPO2
		['schedule\t1710338134', 'none'],
		['modexpgas\tosaka\t0\t0\t0\t0', '500'], // EIP-7883 minimum
		['modexpgas\tprague\t0\t0\t0\t0', '200'], // EIP-2565 minimum
		['modexpgas\tosaka\t32\t32\t32\t0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '4080'],
		['modexpgas\tprague\t32\t32\t32\t0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '1360'],
		['modexpbounds\tosaka\t1024\t1024\t1024', '1'], // EIP-7823
		['modexpbounds\tosaka\t1025\t0\t0', '0'],
		['modexpbounds\tprague\t1025\t0\t0', '1'],
		[
			'powmod\t3\t0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2e\t0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f',
			'1',
		], // EIP-198
		['not-a-query', 'error'],
	]
	assert.deepEqual(
		runOracle(vectors.map(([query]) => query)),
		vectors.map(([, answer]) => answer),
	)
})

// UPSTREAM-DELTA(voltaire: `fakeExponential`, packages/voltaire-ts/src/primitives/FeeMarket/fakeExponential.js).
// EIP-4844 defines `fake_exponential(0, n, d) = 0`. Voltaire clamps a zero result to 1.
// No protocol caller passes `factor = 0` (the factor is MIN_BASE_FEE_PER_BLOB_GAS = 1), so
// consensus values are unaffected, and for every `factor >= 1` the two agree
// (`voltaire/fakeexp` above, which is why that category never generates `factor = 0`).
// Both sides are asserted exactly: Lean answers the normative 0, and Voltaire is pinned to
// its clamp. When Voltaire drops the clamp this test fails: replace `VOLTAIRE_CLAMP` by the
// normative `0n` and let `voltaire/fakeexp` generate `factor = 0`.
test('fake_exponential with factor 0: Lean answers the normative 0, Voltaire is pinned to its clamp of 1', async () => {
	const NORMATIVE = 0n
	const VOLTAIRE_CLAMP = 1n
	const { fakeExponential } = await voltaire('primitives/FeeMarket/fakeExponential.js')
	const inputs = [
		[0n, 0n, 1n],
		[0n, 5n, 7n],
		[0n, 10000000n, 5007716n],
		[0n, 2n ** 64n, 1n],
	]
	assert.deepEqual(
		runOracle(inputs.map((input) => ['fakeexp', ...input].join('\t'))),
		inputs.map(() => String(NORMATIVE)),
	)
	assert.deepEqual(
		inputs.map((input) => fakeExponential(...input)),
		inputs.map(() => VOLTAIRE_CLAMP),
		'Voltaire fakeExponential(0, n, d) changed. If it now returns 0, the upstream clamp is gone: pin NORMATIVE.',
	)
})
