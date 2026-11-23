// Differential fuzz: the compiled Lean 4 oracle (`PrimitivesSpec`) against the
// production implementations it specifies.
//
//   Voltaire TS   FeeMarket, precompile dispatch, P256VERIFY, Uint checked math, Hex
//   TEVM utils    packages/utils/src/viem.js (numberToHex, formatGwei, parseGwei, ...)
//   ZEVM native   strict JSON-RPC Quantity / Data parsing through the Node-API addon
//
// Every case is generated from a fixed seed, so a failure reproduces exactly.
// Run: node --test specs/lean/primitives/diff-fuzz.test.mjs

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const voltaireRoot = process.env.VOLTAIRE_TS ?? '/Users/williamcory/voltaire/packages/voltaire-ts'
const leanBin = join(here, '.lake/build/bin/primitives-spec')
const SEED = Number(process.env.FUZZ_SEED ?? 0x7e5a_2537)

if (!existsSync(leanBin)) {
	execFileSync('lake', ['build'], {
		cwd: here,
		stdio: 'inherit',
		env: { ...process.env, PATH: `${process.env.HOME}/.elan/bin:${process.env.PATH}` },
	})
}

/** @param {string} path */
const load = (path) => import(pathToFileURL(path).href)
const FeeMarket = await load(join(voltaireRoot, 'dist/primitives/FeeMarket/index.js'))
const Precompiles = await load(join(voltaireRoot, 'dist/evm/precompiles/index.js'))
const Hardfork = await load(join(voltaireRoot, 'dist/primitives/Hardfork/index.js'))
const Uint = await load(join(voltaireRoot, 'dist/primitives/Uint/index.js'))
const { Hex } = await load(join(voltaireRoot, 'dist/primitives/Hex/index.js'))
const tevm = await load(join(repoRoot, 'packages/utils/src/viem.js'))

// The proposed Voltaire fix is tested exactly as it ships: the replacement module is
// rebuilt from the patch's own hunk, so the patch cannot drift from what is verified here.
const patchText = readFileSync(join(here, 'upstream/voltaire-weiToGwei-exact.patch'), 'utf8')
const fixedSource = (patchText.split(/^--- a\/.*$/m)[1] ?? '')
	.split('\n')
	.slice(2)
	.filter((line) => line.startsWith('+') || line.startsWith(' '))
	.map((line) => line.slice(1))
	.join('\n')
assert.match(fixedSource, /^export function weiToGwei/m)
const { weiToGwei: weiToGweiFixed } = await import(`data:text/javascript,${encodeURIComponent(fixedSource)}`)
const zevm = createRequire(join(repoRoot, 'packages/node/src/createZevmEngine.js'))('@evmts/zevm')

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------

/** @param {number} seed */
function createRng(seed) {
	let state = seed >>> 0
	const u32 = () => {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return (t ^ (t >>> 14)) >>> 0
	}
	/** @param {number} n */
	const int = (n) => Math.floor((u32() / 0x1_0000_0000) * n)
	/** @param {number} bits */
	const bits = (bits) => {
		let value = 0n
		for (let done = 0; done < bits; done += 32) value = (value << 32n) | BigInt(u32())
		return bits === 0 ? 0n : value & ((1n << BigInt(bits)) - 1n)
	}
	return {
		u32,
		int,
		bits,
		/** @param {number} p */
		chance: (p) => u32() / 0x1_0000_0000 < p,
		/** @template T @param {readonly T[]} items @returns {T} */
		pick: (items) => /** @type {T} */ (items[int(items.length)]),
		/** A u256 with a uniformly chosen bit length, so every magnitude is exercised. */
		u256: () => bits(int(257)),
		/** @param {number} length */
		bytes: (length) => Uint8Array.from({ length }, () => int(256)),
	}
}

// ---------------------------------------------------------------------------
// Lean oracle
// ---------------------------------------------------------------------------

/**
 * Answer a batch of queries with one process run.
 * @param {string[]} queries
 * @returns {string[]}
 */
function lean(queries) {
	for (const query of queries) assert.ok(!/[\n\r]/.test(query), `query spans lines: ${JSON.stringify(query)}`)
	const run = spawnSync(leanBin, { input: `${queries.join('\n')}\n`, maxBuffer: 1 << 28 })
	assert.equal(run.status, 0, `oracle exited ${run.status}: ${run.stderr}`)
	const answers = run.stdout.toString('utf8').split('\n').slice(0, -1)
	assert.equal(answers.length, queries.length, 'oracle answered every query')
	return answers
}

/**
 * Compare production answers with the oracle and fail on the first disagreements.
 * @param {import('node:test').TestContext} t
 * @param {{ query: string, actual: string, source: string }[]} cases
 * @param {number} minimum
 */
function assertAgreement(t, cases, minimum) {
	assert.ok(cases.length >= minimum, `expected at least ${minimum} cases, generated ${cases.length}`)
	const answers = lean(cases.map((c) => c.query))
	const mismatches = []
	for (const [i, c] of cases.entries()) {
		assert.notEqual(answers[i], 'bad-query', `harness sent a malformed query: ${c.query}`)
		if (answers[i] !== c.actual) mismatches.push({ ...c, lean: answers[i] })
	}
	t.diagnostic(`${cases.length} cases, ${mismatches.length} mismatches (seed ${SEED})`)
	assert.deepEqual(mismatches.slice(0, 5), [], `${mismatches.length} of ${cases.length} cases disagree`)
	return answers
}

/**
 * @param {() => unknown} fn
 * @param {(value: any) => string} show
 * @param {string} failure
 */
function attempt(fn, show, failure) {
	let value
	try {
		value = fn()
	} catch {
		return failure
	}
	return show(value)
}

/** @param {Uint8Array} bytes */
const hex = (bytes) => `0x${Buffer.from(bytes).toString('hex')}`
/** @param {Uint8Array} bytes */
const byteList = (bytes) => (bytes.length === 0 ? '-' : Array.from(bytes).join(','))

// ---------------------------------------------------------------------------
// 1. FeeMarket.gweiToWei / weiToGwei
// ---------------------------------------------------------------------------

test('FeeMarket.gweiToWei: Lean exact decimal scaling == Voltaire', (t) => {
	const rng = createRng(SEED ^ 0x01)
	/** @type {number[]} */
	const amounts = [0, -0, 1, 1.5, 0.1 + 0.2, 1e-9, 1e-10, -1e-10, 5e-324, -5e-324, 1e21, 1.5e21, 1e-7]
	amounts.push(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 1e290, -1e290, 123456789.12345679)
	const view = new DataView(new ArrayBuffer(8))
	while (amounts.length < 1000) {
		const kind = rng.int(5)
		let amount
		if (kind === 0) amount = rng.int(1_000_000)
		else if (kind === 1) amount = rng.int(2 ** 31) / 10 ** (1 + rng.int(12))
		else if (kind === 2) amount = Number(`${rng.int(2 ** 31)}.${rng.int(2 ** 31)}e${rng.int(61) - 30}`)
		else if (kind === 3) amount = rng.u32() * 2 ** (rng.int(200) - 100)
		else {
			view.setUint32(0, rng.u32())
			view.setUint32(4, rng.u32())
			amount = view.getFloat64(0)
		}
		if (rng.chance(0.3)) amount = -amount
		// Voltaire documents a RangeError above Number.MAX_VALUE / 1e9; stay inside its domain.
		if (Number.isFinite(amount) && Math.abs(amount) <= 1e290) amounts.push(amount)
	}
	const cases = amounts.map((amount) => ({
		source: 'voltaire FeeMarket.gweiToWei',
		query: `g2w ${amount}`,
		actual: `ok ${FeeMarket.gweiToWei(amount)}`,
	}))
	for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
		assert.throws(() => FeeMarket.gweiToWei(amount), RangeError)
		cases.push({ source: 'voltaire FeeMarket.gweiToWei (non-finite)', query: `g2w ${amount}`, actual: 'err' })
	}
	assertAgreement(t, cases, 1000)
})

test('FeeMarket.gweiToWei: Lean == TEVM parseGwei on exact nine-decimal literals', (t) => {
	const rng = createRng(SEED ^ 0x02)
	const cases = []
	for (let i = 0; i < 500; i++) {
		const whole = rng.bits(rng.int(80)).toString()
		const fraction =
			rng.int(10) === 0
				? ''
				: `.${rng
						.int(1_000_000_000)
						.toString()
						.padStart(9, '0')
						.slice(0, 1 + rng.int(9))}`
		const literal = `${rng.chance(0.2) ? '-' : ''}${whole}${fraction}`
		cases.push({ source: 'tevm parseGwei', query: `g2w ${literal}`, actual: `ok ${tevm.parseGwei(literal)}` })
	}
	assertAgreement(t, cases, 500)
})

test('FeeMarket.weiToGwei: Lean exact rendering == Voltaire (double-exact domain) == TEVM formatGwei', (t) => {
	const rng = createRng(SEED ^ 0x03)
	const cases = []
	for (let i = 0; i < 600; i++) {
		// Below 2^52 wei the upstream `Number(wei) / 1e9` path is exact. See the regression test below.
		const wei = rng.bits(rng.int(53))
		cases.push({
			source: 'voltaire FeeMarket.weiToGwei',
			query: `w2g ${wei}`,
			actual: `ok ${FeeMarket.weiToGwei(wei)}`,
		})
	}
	for (let i = 0; i < 600; i++) {
		const wei = rng.chance(0.2) ? rng.bits(rng.int(40)) * 1_000_000_000n : rng.u256()
		cases.push({ source: 'tevm formatGwei', query: `w2gt ${wei}`, actual: `ok ${tevm.formatGwei(wei)}` })
		cases.push({ source: 'voltaire weiToGwei (patched)', query: `w2g ${wei}`, actual: `ok ${weiToGweiFixed(wei)}` })
	}
	assertAgreement(t, cases, 1800)
})

test('FeeMarket round trip: gweiToWei(weiToGwei(wei)) == wei through both implementations', (t) => {
	const rng = createRng(SEED ^ 0x04)
	const weis = Array.from({ length: 400 }, () => rng.u256())
	const rendered = lean(weis.map((wei) => `w2g ${wei}`)).map((answer) => answer.slice(3))
	const back = lean(rendered.map((gwei) => `g2w ${gwei}`))
	for (const [i, wei] of weis.entries()) {
		assert.equal(back[i], `ok ${wei}`)
		assert.equal(tevm.parseGwei(/** @type {string} */ (rendered[i])), wei)
	}
	t.diagnostic(`${weis.length} two-step round trips (seed ${SEED})`)
})

// Regression: Voltaire's weiToGwei goes through `Number(wei) / 1e9`, which loses digits
// from 2^52 wei upward. The Lean spec, TEVM formatGwei and Voltaire's own Zig
// implementation all use exact integer division.
const WEI_TO_GWEI_REGRESSIONS = /** @type {const} */ ([
	[8_999_999_999_999_999n, '8999999.999999999'],
	[123_456_789_123_456_789n, '123456789.123456789'],
	[2n ** 64n, '18446744073.709551616'],
	[2n ** 256n - 1n, '115792089237316195423570985008687907853269984665640564039457584007913.129639935'],
])

test('regression: weiToGwei is exact at and above 2^52 wei (Lean spec and patched Voltaire)', () => {
	const answers = lean(WEI_TO_GWEI_REGRESSIONS.map(([wei]) => `w2g ${wei}`))
	for (const [i, [wei, expected]] of WEI_TO_GWEI_REGRESSIONS.entries()) {
		assert.equal(answers[i], `ok ${expected}`)
		assert.equal(weiToGweiFixed(wei), expected)
		assert.equal(tevm.formatGwei(wei), expected)
	}
})

test('regression: installed Voltaire weiToGwei is exact at and above 2^52 wei', {
	todo: 'apply upstream/voltaire-weiToGwei-exact.patch in the Voltaire repository',
}, () => {
	for (const [wei, expected] of WEI_TO_GWEI_REGRESSIONS) assert.equal(FeeMarket.weiToGwei(wei), expected)
})

// ---------------------------------------------------------------------------
// 2. Precompile dispatch (EIP-2537 final layout)
// ---------------------------------------------------------------------------

/** @type {string[]} */
const FORKS = Hardfork.HARDFORK_ORDER
const NAME_BY_ADDRESS = new Map(Object.entries(Precompiles.PrecompileAddress).map(([name, address]) => [address, name]))

/** @param {bigint} value */
const address = (value) => `0x${value.toString(16).padStart(40, '0')}`

/**
 * @param {string} addr
 * @param {string} fork
 */
function dispatchCase(addr, fork) {
	const name = NAME_BY_ADDRESS.get(addr.toLowerCase()) ?? 'none'
	const active = Precompiles.isPrecompile(addr, fork)
	// `execute` must refuse exactly the addresses `isPrecompile` rejects.
	if (!active) {
		const result = Precompiles.execute(addr, new Uint8Array(0), 0n, fork)
		assert.deepEqual([result.success, result.gasUsed], [false, 0n])
	}
	return { source: 'voltaire isPrecompile', query: `pc ${addr} ${fork}`, actual: `${name} ${active ? 1 : 0}` }
}

test('precompile dispatch: Lean table == Voltaire isPrecompile for every fork', (t) => {
	const rng = createRng(SEED ^ 0x05)
	assert.equal(FORKS.length, 20)
	const cases = []
	for (const fork of FORKS) {
		for (let a = 0n; a <= 0x20n; a++) cases.push(dispatchCase(address(a), fork))
		for (const a of [0xffn, 0x100n, 0x101n, 0x1100n]) cases.push(dispatchCase(address(a), fork))
	}
	for (let i = 0; i < 800; i++) {
		const kind = rng.int(4)
		let value
		if (kind === 0) value = BigInt(rng.int(0x14))
		else if (kind === 1) value = BigInt(0x0b + rng.int(9)) | (1n << BigInt(8 + rng.int(152)))
		else if (kind === 2) value = rng.bits(160)
		else value = 0x100n + BigInt(rng.int(3)) - 1n
		let addr = address(value)
		if (rng.chance(0.3)) addr = `0x${addr.slice(2).toUpperCase()}`
		if (rng.chance(0.05)) addr = addr.slice(0, 2 + rng.int(40))
		cases.push(dispatchCase(addr, rng.pick(FORKS)))
	}
	const answers = assertAgreement(t, cases, 1500)
	// Sanity: the corpus really covers all seven BLS operations plus the rejected 0x12/0x13.
	const seen = new Set(answers)
	for (const op of ['G1_ADD', 'G1_MSM', 'G2_ADD', 'G2_MSM', 'PAIRING', 'MAP_FP_TO_G1', 'MAP_FP2_TO_G2']) {
		assert.ok(seen.has(`BLS12_${op} 1`) && seen.has(`BLS12_${op} 0`), `BLS12_${op} active and inactive`)
	}
	for (const fork of FORKS) {
		assert.equal(Precompiles.isPrecompile(address(0x12n), fork), false)
		assert.equal(Precompiles.isPrecompile(address(0x13n), fork), false)
	}
})

// ---------------------------------------------------------------------------
// 3. EIP-7951 P256VERIFY
// ---------------------------------------------------------------------------

const P256_N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n
const P256_P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn

const vectors = readFileSync(join(voltaireRoot, 'src/evm/precompiles/p256verify.vectors.txt'), 'utf8')
	.split('\n')
	.filter((line) => line.length > 0 && !line.startsWith('#'))
	.map((line) => {
		const [input = '', flag] = line.split(' ')
		return { input: Uint8Array.from(Buffer.from(input, 'hex')), valid: flag === '1' }
	})

/**
 * @param {Uint8Array} input
 * @param {number} field
 * @param {bigint} value
 */
function withField(input, field, value) {
	const out = Uint8Array.from(input)
	out.set(Buffer.from(value.toString(16).padStart(64, '0'), 'hex'), field * 32)
	return out
}

/**
 * @param {Uint8Array} input
 * @param {number} field
 */
const fieldOf = (input, field) => BigInt(hex(input.subarray(field * 32, field * 32 + 32)))

/**
 * @param {Uint8Array} input
 * @param {bigint} gasLimit
 * @param {string} fork
 */
function p256Case(input, gasLimit, fork) {
	const result = Precompiles.execute(Precompiles.P256VERIFY_ADDRESS, input, gasLimit, fork)
	const active = Precompiles.isPrecompile(Precompiles.P256VERIFY_ADDRESS, fork)
	if (active) assert.deepEqual(Precompiles.p256Verify(input, gasLimit), result)
	else assert.deepEqual([result.success, result.gasUsed], [false, 0n])
	return {
		source: 'voltaire p256Verify',
		query: `p256 ${fork} ${gasLimit} ${hex(input)}`,
		actual: active ? `${result.success ? 1 : 0} ${result.gasUsed} ${hex(result.output)}` : 'none',
	}
}

/**
 * Strip the diagnostic check name so the comparison covers exactly what Voltaire returns.
 * @param {import('node:test').TestContext} t
 * @param {{ query: string, actual: string, source: string, expectCheck?: string }[]} cases
 * @param {number} minimum
 */
function assertP256Agreement(t, cases, minimum) {
	assert.ok(cases.length >= minimum)
	const answers = lean(cases.map((c) => c.query))
	const mismatches = []
	/** @type {Record<string, number>} */
	const checks = {}
	for (const [i, c] of cases.entries()) {
		const answer = /** @type {string} */ (answers[i])
		const check = answer === 'none' ? 'inactive' : answer.slice(answer.lastIndexOf(' ') + 1)
		const result = answer === 'none' ? answer : answer.slice(0, answer.lastIndexOf(' '))
		checks[check] = (checks[check] ?? 0) + 1
		if (result !== c.actual) mismatches.push({ ...c, lean: answer })
		if (c.expectCheck !== undefined && check !== 'inactive') assert.equal(check, c.expectCheck, c.query)
	}
	t.diagnostic(`${cases.length} cases, ${mismatches.length} mismatches (seed ${SEED}) ${JSON.stringify(checks)}`)
	assert.deepEqual(mismatches.slice(0, 3), [], `${mismatches.length} of ${cases.length} cases disagree`)
	return checks
}

test('P256VERIFY: Lean == Voltaire == go-ethereum/Wycheproof vectors', (t) => {
	assert.ok(vectors.length >= 700)
	const cases = vectors.map((vector) => ({
		...p256Case(vector.input, 6900n, 'osaka'),
		expectCheck: vector.valid ? 'valid' : undefined,
	}))
	for (const [i, vector] of vectors.entries()) {
		assert.equal(cases[i]?.actual, `1 6900 0x${vector.valid ? `${'00'.repeat(31)}01` : ''}`)
	}
	assertP256Agreement(t, cases, 700)
})

test('P256VERIFY: Lean framing, bounds, gas and fork gating == Voltaire on mutated inputs', (t) => {
	const rng = createRng(SEED ^ 0x06)
	const valid = vectors.filter((vector) => vector.valid && vector.input.length === 160).map((vector) => vector.input)
	assert.ok(valid.length >= 100)
	const cases = []
	for (let i = 0; i < 1400; i++) {
		const base = rng.pick(valid)
		const kind = rng.int(14)
		/** @type {Uint8Array} */
		let input = base
		/** @type {string | undefined} */
		let expectCheck
		if (kind === 0) expectCheck = 'valid'
		else if (kind === 1) {
			// High-s twin: EIP-7951 has no malleability check.
			input = withField(base, 2, P256_N - fieldOf(base, 2))
			expectCheck = 'valid'
		} else if (kind === 2) {
			const length = rng.pick([0, 1, 31, 32, 64, 96, 128, 159, 161, 192, 320, rng.int(400)])
			input = length <= 160 ? base.subarray(0, length) : Uint8Array.from({ length }, (_, j) => base[j] ?? rng.int(256))
			expectCheck = length === 160 ? 'valid' : 'badLength'
		} else if (kind === 3) {
			const field = rng.pick([1, 2])
			input = withField(base, field, rng.pick([0n, P256_N, P256_N + 1n, 2n ** 256n - 1n, P256_N + rng.bits(64)]))
			expectCheck = 'badScalar'
		} else if (kind === 4) {
			const field = rng.pick([3, 4])
			input = withField(base, field, rng.pick([P256_P, P256_P + 1n, 2n ** 256n - 1n, P256_P + rng.bits(32)]))
			expectCheck = 'badField'
		} else if (kind === 5) {
			input = withField(withField(base, 3, 0n), 4, 0n)
			expectCheck = 'infinity'
		} else if (kind === 6) {
			// Boundary scalars that pass the range check.
			input = withField(base, rng.pick([1, 2]), rng.pick([1n, P256_N - 1n]))
		} else if (kind === 7) {
			// Coordinates just inside the field.
			input = withField(base, rng.pick([3, 4]), rng.pick([0n, 1n, P256_P - 1n]))
		} else if (kind === 8) {
			// Another signer's on-curve key.
			const other = rng.pick(valid)
			input = Uint8Array.from(base)
			input.set(other.subarray(96, 160), 96)
		} else if (kind === 9) {
			input = withField(base, 0, rng.pick([0n, P256_N, rng.bits(256)]))
		} else if (kind === 10) {
			input = Uint8Array.from(base)
			const at = rng.int(160)
			input[at] = /** @type {number} */ (input[at]) ^ (1 << rng.int(8))
		} else if (kind === 11) {
			input = withField(base, rng.int(5), rng.bits(256))
		} else if (kind === 12) {
			input = rng.bytes(160)
		} else {
			input = rng.pick(vectors).input
		}
		const gasKind = rng.int(10)
		const gasLimit =
			gasKind < 5 ? 6900n + rng.bits(rng.int(64)) : gasKind < 7 ? 6900n : gasKind < 9 ? BigInt(rng.int(6900)) : 6899n
		const fork = rng.chance(0.75) ? rng.pick(['osaka', 'amsterdam']) : rng.pick(FORKS)
		const c = p256Case(input, gasLimit, fork)
		// Gas: 6900 when affordable, otherwise the whole limit; gating: nothing before Osaka.
		if (c.actual !== 'none')
			assert.ok(c.actual.startsWith(gasLimit >= 6900n ? '1 6900 ' : `0 ${gasLimit} 0x`), c.actual)
		cases.push({ ...c, expectCheck })
	}
	const checks = assertP256Agreement(t, cases, 1400)
	for (const check of [
		'badLength',
		'badScalar',
		'badField',
		'infinity',
		'offCurve',
		'badSignature',
		'valid',
		'inactive',
	]) {
		assert.ok((checks[check] ?? 0) > 0, `corpus reaches ${check}`)
	}
})

// ---------------------------------------------------------------------------
// 4. Quantity / Data hex codecs
// ---------------------------------------------------------------------------

const node = new zevm.NativeNode({})
const ACCOUNT = '0x00000000000000000000000000000000000000aa'

/**
 * @param {string} method
 * @param {unknown[]} params
 */
function rpc(method, params) {
	return JSON.parse(node.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })))
}

/**
 * Corrupt a canonical hex string in one of the ways a strict parser must notice.
 * @param {ReturnType<typeof createRng>} rng
 * @param {string} canonical
 */
function mutateHex(rng, canonical) {
	const digits = canonical.slice(2)
	const at = rng.int(digits.length + 1)
	switch (rng.int(14)) {
		case 0:
			return canonical
		case 1:
			return `0x${Array.from(digits, (c) => (rng.chance(0.5) ? c.toUpperCase() : c)).join('')}`
		case 2:
			return `0x${'0'.repeat(1 + rng.int(3))}${digits}`
		case 3:
			return digits
		case 4:
			return `0X${digits}`
		case 5:
			return `-${canonical}`
		case 6:
			return `0x${digits.slice(0, at)}${rng.pick(['g', 'G', 'z', 'x', 'X', ' ', '_', '-', '+', '.', 'é', '１', '\t', 'o'])}${digits.slice(at)}`
		case 7:
			return `0x${digits}${rng.bits(4 * (1 + rng.int(8))).toString(16)}`
		case 8:
			return rng.pick(['', '0', '0x', '0x0', '0x00', '0x000', 'x', '0x-1', '0x+1', '0x0x1', '00x1', '1', 'latest'])
		case 9:
			return rng.chance(0.5) ? ` ${canonical}` : `${canonical} `
		case 10:
			return BigInt(canonical === '0x' ? '0x0' : canonical).toString(10)
		case 11:
			return `0x${digits.slice(0, at)}${digits.slice(at + 1)}`
		case 12:
			return `0x${digits.slice(0, at)}${rng.int(16).toString(16)}${digits.slice(at)}`
		default:
			return `0x${rng.bits(4 * rng.int(70)).toString(16)}`
	}
}

test('Quantity: Lean canonical encoding == TEVM numberToHex == Voltaire Uint.toHex == ZEVM', (t) => {
	const rng = createRng(SEED ^ 0x07)
	const cases = []
	const values = [0n, 1n, 15n, 16n, 255n, 256n, 2n ** 64n, 2n ** 256n - 1n]
	while (values.length < 600) values.push(rng.u256())
	for (const value of values) {
		const query = `qenc ${value}`
		cases.push({ source: 'tevm numberToHex', query, actual: `ok ${tevm.numberToHex(value)}` })
		cases.push({ source: 'voltaire Uint.toHex', query, actual: `ok ${Uint.toHex(value, false)}` })
		cases.push({ source: 'voltaire Hex.fromBigInt', query, actual: `ok ${Hex.fromBigInt(value)}` })
		assert.equal(rpc('anvil_setBalance', [ACCOUNT, tevm.numberToHex(value)]).result, true)
		cases.push({
			source: 'zevm eth_getBalance',
			query,
			actual: `ok ${rpc('eth_getBalance', [ACCOUNT, 'latest']).result}`,
		})
	}
	assertAgreement(t, cases, 2400)
})

test('Quantity: Lean strict u256 parser == ZEVM native parser on hostile strings', (t) => {
	const rng = createRng(SEED ^ 0x08)
	const cases = []
	let accepted = 0
	for (let i = 0; i < 1500; i++) {
		const text = mutateHex(rng, tevm.numberToHex(rng.chance(0.1) ? 2n ** 256n - 1n - BigInt(rng.int(3)) : rng.u256()))
		rpc('anvil_setBalance', [ACCOUNT, '0x0'])
		const response = rpc('anvil_setBalance', [ACCOUNT, text])
		let actual = 'err'
		if (response.error === undefined) {
			accepted++
			const balance = rpc('eth_getBalance', [ACCOUNT, 'latest']).result
			actual = `ok ${BigInt(balance)}`
			// Everything the strict parser accepts, the lenient host parsers read identically.
			assert.equal(tevm.hexToBigInt(text), BigInt(balance))
			assert.equal(Uint.fromHex(text), BigInt(balance))
		} else {
			assert.equal(response.error.code, -32602)
		}
		cases.push({ source: 'zevm anvil_setBalance', query: `qdec256 ${text}`, actual })
	}
	assert.ok(accepted > 200 && accepted < 1300, `accepted ${accepted} of 1500`)
	t.diagnostic(`${accepted} accepted, ${1500 - accepted} rejected`)
	assertAgreement(t, cases, 1500)
})

test('Data: Lean codec == Voltaire Hex == TEVM bytesToHex == ZEVM native parser', (t) => {
	const rng = createRng(SEED ^ 0x09)
	const cases = []
	let accepted = 0
	for (let i = 0; i < 900; i++) {
		const bytes = rng.bytes(rng.pick([0, 1, 2, 20, 32, rng.int(65)]))
		const canonical = hex(bytes)
		const encode = `denc ${byteList(bytes)}`
		cases.push({ source: 'voltaire Hex.fromBytes', query: encode, actual: `ok ${Hex.fromBytes(bytes)}` })
		cases.push({ source: 'tevm bytesToHex', query: encode, actual: `ok ${tevm.bytesToHex(bytes)}` })

		const text = mutateHex(rng, canonical)
		const decode = `ddec ${text}`
		cases.push({
			source: 'voltaire Hex.toBytes',
			query: decode,
			actual: attempt(
				() => Hex.toBytes(text),
				(out) => `ok ${byteList(out)}`,
				'err',
			),
		})
		rpc('anvil_setCode', [ACCOUNT, '0x'])
		const response = rpc('anvil_setCode', [ACCOUNT, text])
		let actual = 'err'
		if (response.error === undefined) {
			accepted++
			const code = rpc('eth_getCode', [ACCOUNT, 'latest']).result
			actual = `ok ${byteList(Buffer.from(code.slice(2), 'hex'))}`
			assert.equal(tevm.bytesToHex(tevm.hexToBytes(text)), code)
		}
		cases.push({ source: 'zevm anvil_setCode', query: decode, actual })
	}
	assert.ok(accepted > 150 && accepted < 800, `accepted ${accepted} of 900`)
	t.diagnostic(`${accepted} accepted, ${900 - accepted} rejected by zevm`)
	assertAgreement(t, cases, 3600)
})

// ---------------------------------------------------------------------------
// 5. Checked u256 arithmetic
// ---------------------------------------------------------------------------

test('checked u256 arithmetic: Lean == Voltaire Uint plusChecked / timesChecked / minusChecked', (t) => {
	const rng = createRng(SEED ^ 0x0a)
	const MAX = 2n ** 256n - 1n
	assert.equal(Uint.MAX, MAX)
	const show = (/** @type {bigint} */ value) => `ok ${value}`
	const cases = []
	/** @type {Record<string, number>} */
	const rejected = { add: 0, mul: 0, sub: 0, cost: 0 }
	/** @param {{ query: string, actual: string, source: string }} c */
	const push = (c) => {
		if (c.actual === 'none')
			rejected[c.query.slice(0, c.query.indexOf(' '))] = (rejected[c.query.slice(0, c.query.indexOf(' '))] ?? 0) + 1
		cases.push(c)
	}
	for (let i = 0; i < 700; i++) {
		const edge = rng.int(8)
		const a = edge === 0 ? MAX : edge === 1 ? MAX - rng.bits(8) : rng.u256()
		const b =
			edge === 2 ? MAX : edge === 3 ? MAX - a + rng.bits(2) - 1n : edge === 4 ? a + rng.bits(2) - 1n : rng.u256()
		if (b < 0n || b > MAX) continue
		push({
			source: 'voltaire Uint.plusChecked',
			query: `add ${a} ${b}`,
			actual: attempt(() => Uint.plusChecked(a, b), show, 'none'),
		})
		push({
			source: 'voltaire Uint.minusChecked',
			query: `sub ${a} ${b}`,
			actual: attempt(() => Uint.minusChecked(a, b), show, 'none'),
		})
		// Product operands sized so about half the products overflow.
		const x = rng.bits(rng.int(200))
		const y = edge === 5 && x > 0n ? MAX / x + rng.bits(1) : rng.bits(rng.int(200))
		push({
			source: 'voltaire Uint.timesChecked',
			query: `mul ${x} ${y}`,
			actual: attempt(() => Uint.timesChecked(x, y), show, 'none'),
		})
		// Up-front transaction cost: gasLimit * maxFeePerGas + value.
		const gasLimit = rng.bits(rng.int(65))
		const fee = rng.bits(rng.int(220))
		const value = edge === 6 ? MAX - gasLimit * fee + rng.bits(1) : rng.u256()
		if (value < 0n || value > MAX) continue
		push({
			source: 'voltaire Uint.timesChecked + plusChecked',
			query: `cost ${gasLimit} ${fee} ${value}`,
			actual: attempt(() => Uint.plusChecked(Uint.timesChecked(gasLimit, fee), value), show, 'none'),
		})
	}
	for (const [op, count] of Object.entries(rejected))
		assert.ok(count > 20, `${op} overflow branch reached ${count} times`)
	t.diagnostic(`rejected ${JSON.stringify(rejected)}`)
	const answers = assertAgreement(t, cases, 2400)
	// No-wrap: an accepted result is never the reduced-mod-2^256 value of a larger one.
	for (const [i, c] of cases.entries()) {
		const [op = '', a = '0', b = '0'] = c.query.split(' ')
		const answer = /** @type {string} */ (answers[i])
		if (op === 'add' && answer === 'none')
			assert.notEqual(Uint.plusWrapping(BigInt(a), BigInt(b)), BigInt(a) + BigInt(b))
		if (op === 'mul' && answer === 'none')
			assert.notEqual(Uint.timesWrapping(BigInt(a), BigInt(b)), BigInt(a) * BigInt(b))
	}
})

test.after(() => node.close())
