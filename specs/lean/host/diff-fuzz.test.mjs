// Differential fuzz: the compiled Lean oracle (`host-spec`) against TEVM's live JavaScript.
// Run:   node --test specs/lean/host/diff-fuzz.test.mjs      (HOST_SPEC_SEED=<n> to vary the seed)
// Setup: see ../oracle.mjs for LEAN_SKIP_BUILD and ELAN_HOME.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { pathToFileURL } from 'node:url'
import { encodeFunctionData, getAddress, parseAbi, toFunctionSelector } from 'viem'
import { buildOracle, REPO_ROOT } from '../oracle.mjs'

const here = import.meta.dirname
const load = (relative) => import(pathToFileURL(join(REPO_ROOT, relative)).href)

// `effect` is a dependency of `@tevm/config`, not of this directory. Resolve this file's
// `effect` imports from that package with Node's own resolution, so the suite runs the
// exact module instance `loadRemappings` builds its effects with.
const configPackage = pathToFileURL(join(REPO_ROOT, 'bundler-packages/config/package.json')).href
registerHooks({
	resolve: (specifier, context, nextResolve) =>
		context.parentURL === import.meta.url && (specifier === 'effect' || specifier.startsWith('effect/'))
			? nextResolve(specifier, { ...context, parentURL: configPackage })
			: nextResolve(specifier, context),
})

const { extractJsonRpcFrames } = await load('packages/server/src/internal/extractJsonRpcFrames.js')
const { loadRemappings } = await load('bundler-packages/config/src/json/loadRemappingstxt.js')
const { either, runSync } = await import('effect/Effect')
const { decodeHardhatConsoleLog } = await load('packages/utils/src/decodeHardhatConsoleLog.js')
const { parseSemver, resolveWorkspaceRange, satisfiesRange, validatePackageManifests } = await load(
	'scripts/prepare-changeset-publish.mjs',
)

const seed = Number(process.env.HOST_SPEC_SEED ?? 20261123)
let prngState = seed >>> 0
/** mulberry32 */
const random = () => {
	prngState = (prngState + 0x6d2b79f5) >>> 0
	let t = prngState
	t = Math.imul(t ^ (t >>> 15), t | 1)
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (max) => Math.floor(random() * max)
const pick = (items) => items[int(items.length)]
const chance = (p) => random() < p
const text = (alphabet, maxLength) => Array.from({ length: int(maxLength + 1) }, () => pick(alphabet)).join('')
const hex = (value) => Buffer.from(value, 'utf8').toString('hex')
const unhex = (value) => Buffer.from(value, 'hex').toString('utf8')

/** @type {Array<{domain: string, query: string, check: (answer: string) => void, input: unknown}>} */
const cases = []
const add = (domain, query, input, check) => cases.push({ domain, query, input, check })

// 1. JSON-RPC stream framing

const FRAME_ALPHABET = [
	...'{{{}}}[[]]""\\\\\n\n\r\t  ,:ax01',
	' ',
	' ',
	'﻿',
	'　',
	'é',
	'😀',
	'{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}',
	'[{"id":1},{"id":2}]',
	'{"a":"}\\"]{"}',
	'ping\n',
	'  garbage {x} \r\n',
]
const parseFrames = (answer) => {
	const fields = answer.split(',')
	const count = Number(fields[0])
	assert.equal(fields.length, count + 2)
	return [fields.slice(1, 1 + count).map(unhex), unhex(fields[count + 1])]
}

for (let i = 0; i < 700; i++) {
	const input = text(FRAME_ALPHABET, 40)
	const expected = extractJsonRpcFrames(input)
	add('framing', `F,${hex(input)}`, input, (answer) => assert.deepEqual(parseFrames(answer), expected))
}

// Multi-step: the server's buffer loop over random chunk boundaries.
for (let i = 0; i < 400; i++) {
	const stream = text(FRAME_ALPHABET, 60)
	const points = [...stream]
	/** @type {string[]} */
	const chunks = []
	for (let at = 0; at < points.length; ) {
		const size = int(12)
		chunks.push(points.slice(at, at + size).join(''))
		at += size
	}
	/** @type {string[]} */
	const frames = []
	let buffer = ''
	for (const chunk of chunks) {
		const [complete, remaining] = extractJsonRpcFrames(buffer + chunk)
		frames.push(...complete)
		buffer = remaining
	}
	// The JavaScript must itself satisfy the proved `feed_chunks` theorem.
	assert.deepEqual(
		[frames, buffer],
		extractJsonRpcFrames(stream),
		`chunking changed frames of ${JSON.stringify(stream)}`,
	)
	add('framing-stream', ['G', ...chunks.map(hex)].join(','), chunks, (answer) =>
		assert.deepEqual(parseFrames(answer), [frames, buffer]),
	)
}

// 2. remappings.txt

const scratch = mkdtempSync(join(tmpdir(), 'host-spec-'))
after(() => rmSync(scratch, { recursive: true, force: true }))
const REMAP_ALPHABET = [
	...'==  \t//\\\\@ab-_.1',
	'\n',
	'\n',
	'\r',
	'\r\n',
	' ',
	' ',
	'﻿',
	'é',
	'😀',
	'@oz/=lib/oz/',
	'forge-std/=/lib/forge-std/src/',
	'a=b=c',
	'ds-test/=\\lib\\ds-test\\',
	'=empty',
	'noequals',
	'__proto__=x',
	'1=one',
]
// Relative directories whose names contain `\` reach the Windows-separator branches on POSIX.
const CONFIG_DIRS = ['plain', 'plain/', 'nested/dir', 'back\\slash', 'trail\\', 'mix\\ed/dir', 'mix/ed\\']
const cwd = process.cwd()
process.chdir(scratch)
try {
	for (const dir of CONFIG_DIRS) mkdirSync(dir, { recursive: true })
	for (let i = 0; i < 600; i++) {
		const relative = pick(CONFIG_DIRS)
		const configPath = chance(0.4) ? relative : `${process.cwd()}/${relative}`
		const missing = chance(0.03)
		const contents = missing ? '' : text(REMAP_ALPHABET, 14)
		const file = join(configPath, 'remappings.txt')
		rmSync(file, { force: true })
		if (!missing) writeFileSync(file, contents)
		const result = runSync(either(loadRemappings(configPath)))
		const expected =
			result._tag === 'Left'
				? { error: result.left.message }
				: { entries: Object.entries(result.right.remappings ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) }
		add('remappings', `R,${hex(configPath)},${hex(contents)}`, { configPath, contents }, (answer) => {
			const fields = answer.split(',')
			if (fields[0] === 'E') return assert.deepEqual({ error: unhex(fields[1]) }, expected)
			assert.equal(fields[0], 'O')
			/** @type {Array<[string, string]>} */
			const entries = []
			for (let k = 0; k < Number(fields[1]); k++) entries.push([unhex(fields[2 + 2 * k]), unhex(fields[3 + 2 * k])])
			assert.equal(new Set(entries.map(([key]) => key)).size, entries.length, 'oracle emitted a duplicate prefix')
			entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			assert.deepEqual({ entries }, expected)
		})
	}
} finally {
	process.chdir(cwd)
}

// 3. Hardhat console.log format strings

const FORMAT_ALPHABET = [
	...'%%%%sdifox ab',
	'%s',
	'%d',
	'%i',
	'%f',
	'%o',
	'%%',
	'%%s',
	'%',
	'é',
	'😀',
	"'",
	'\u0000',
	'﻿',
]
const LOG_TYPES = ['uint256', 'int256', 'string', 'bool', 'address']
const randomBigInt = (signed) => {
	const magnitude = BigInt(`0x${text([...'0123456789abcdef'], pick([1, 4, 16, 63]))}0`) >> 4n
	return signed && chance(0.5) ? -magnitude : magnitude
}
const digits = (min, max) => text([...'0123456789'], max - min).padEnd(min, pick([...'0123456789']))
/** Text near the grammars of `Number`, `parseInt` and `parseFloat`: valid literals and near misses. */
const numericText = () => {
	const roll = int(20)
	if (roll === 0)
		return pick([
			'',
			' ',
			'42',
			'-0',
			'+5',
			'007',
			'.5',
			'5.',
			'.',
			'1e21',
			'1e-7',
			'0.000001',
			'Infinity',
			'-Infinity',
		])
	if (roll === 1)
		return pick([
			'NaN',
			'infinity',
			'1_000',
			'0x',
			'0b102',
			'0o78',
			'--1',
			'+-1',
			'1e',
			'1e+',
			'.e5',
			'e5',
			'1.2.3',
			'12px',
			'0x1g',
		])
	if (roll === 2) return `${pick(['0x', '0X', '0b', '0o'])}${text([...'0123456789abcdefABCDEF'], 14)}`
	let value = chance(0.3) ? pick(['-', '+']) : ''
	value += chance(0.85) ? digits(1, pick([1, 3, 15, 16, 17, 22])) : ''
	if (chance(0.4)) value += `.${chance(0.9) ? digits(1, pick([1, 3, 8])) : ''}`
	if (chance(0.25)) value += `${pick(['e', 'E'])}${pick(['', '+', '-'])}${chance(0.9) ? digits(1, 3) : ''}`
	if (chance(0.15)) value = `${pick([' ', '\t', '\n', '\u00a0', '\ufeff'])}${value}`
	if (chance(0.15)) value += pick([' ', '\n', 'x', '.', 'e', '%', '0x1'])
	return value
}
const randomHex = (bytes) => `0x${Array.from({ length: bytes * 2 }, () => pick([...'0123456789abcdef'])).join('')}`
/** @returns {{value: unknown, arg: string}} the ABI value and its oracle encoding */
const randomArg = (type) => {
	if (type === 'uint256' || type === 'int256') {
		const value = randomBigInt(type === 'int256')
		return { value, arg: `i${value}` }
	}
	if (type === 'bool') {
		const value = chance(0.5)
		return { value, arg: `b${value ? 1 : 0}` }
	}
	if (type === 'address') {
		const value = getAddress(randomHex(20))
		return { value, arg: `s${hex(value)}` }
	}
	if (type === 'bytes') {
		const value = randomHex(int(40))
		return { value, arg: `s${hex(value)}` }
	}
	// A third of the string arguments are numeric text, which `%d`, `%i` and `%f` coerce.
	const value = chance(0.35) ? numericText() : text(FORMAT_ALPHABET, 10)
	return { value, arg: `s${hex(value)}` }
}
/**
 * Console cases the oracle declined: the printed text of a `%d`, `%i` or `%f` string
 * coercion depends on binary rounding, which `HostSpec.ConsoleFmt` does not model.
 * @type {Record<string, number>}
 */
const unmodeled = {}
/** Queue one `formatArgs` case. The oracle answers the formatted text, or `U` when it makes no claim. */
const addConsole = (domain, signature, args, formatted, also = () => {}) =>
	add(
		domain,
		['C', ...args.map(({ arg }) => arg)].join(','),
		{ signature, args: args.map(({ arg }) => arg) },
		(answer) => {
			if (answer === 'U') {
				unmodeled[domain] = (unmodeled[domain] ?? 0) + 1
				return
			}
			assert.equal(unhex(answer), formatted)
			also(answer)
		},
	)
const TYPED_HELPERS = [
	['logInt', 'int256'],
	['logUint', 'uint256'],
	['logString', 'string'],
	['logBool', 'bool'],
	['logAddress', 'address'],
	['logBytes', 'bytes'],
]
for (let i = 0; i < 700; i++) {
	let name = 'log'
	/** @type {string[]} */
	let types
	if (chance(0.1)) [name, ...types] = pick(TYPED_HELPERS)
	else if (chance(0.6)) types = ['string', ...Array.from({ length: int(4) }, () => pick(LOG_TYPES))]
	else types = Array.from({ length: int(5) }, () => pick(LOG_TYPES))
	const args = types.map(randomArg)
	const signature = `${name}(${types.join(',')})`
	const calldata = encodeFunctionData({
		abi: parseAbi([`function ${signature}`]),
		args: args.map(({ value }) => value),
	})
	assert.equal(calldata.slice(0, 10), toFunctionSelector(signature))
	const decoded = decodeHardhatConsoleLog(calldata)
	assert.ok(decoded, `decodeHardhatConsoleLog rejected ${signature}`)
	addConsole('console', signature, args, decoded.formatted)
}

// A lone string is printed unchanged: it is not a format string, so `%%` stays `%%`.
for (let i = 0; i < 150; i++) {
	const value = chance(0.2) ? pick(['100%%', '%%', '%', '%d', '%s %s', '50%% of %d', '']) : text(FORMAT_ALPHABET, 12)
	const decoded = decodeHardhatConsoleLog(
		encodeFunctionData({ abi: parseAbi(['function log(string)']), args: [value] }),
	)
	assert.ok(decoded, 'decodeHardhatConsoleLog rejected log(string)')
	addConsole('console-lone', 'log(string)', [{ value, arg: `s${hex(value)}` }], decoded.formatted, (answer) =>
		assert.equal(unhex(answer), value, 'the oracle prints a lone string unchanged'),
	)
}

// Every case coerces one string through `%d`, `%i` or `%f`.
for (let i = 0; i < 400; i++) {
	const specifier = pick(['%d', '%i', '%f'])
	const format = chance(0.8) ? specifier : `${text([...'ab %'], 3)}${specifier}${pick(['', '%%', ' x'])}`
	const value = numericText()
	const decoded = decodeHardhatConsoleLog(
		encodeFunctionData({ abi: parseAbi(['function log(string,string)']), args: [format, value] }),
	)
	assert.ok(decoded, 'decodeHardhatConsoleLog rejected log(string,string)')
	addConsole(
		'console-numeric',
		'log(string,string)',
		[
			{ value: format, arg: `s${hex(format)}` },
			{ value, arg: `s${hex(value)}` },
		],
		decoded.formatted,
	)
}

// 4. Semver and #2097 dependency-protocol leaks

const NUMBERS = [
	'0',
	'0',
	'1',
	'1',
	'2',
	'3',
	'10',
	'01',
	'',
	'9007199254740991',
	'9007199254740992',
	'99999999999999999999',
]
const IDENTIFIERS = ['0', '1', '2', '10', '01', 'alpha', 'beta', 'rc', 'a', 'A', '-', 'x-1', '1a', '00', '', 'é']
const randomVersion = () => {
	let version = `${pick(NUMBERS)}.${pick(NUMBERS)}.${pick(NUMBERS)}`
	if (chance(0.5)) version += `-${Array.from({ length: 1 + int(3) }, () => pick(IDENTIFIERS)).join('.')}`
	if (chance(0.2)) version += `+${Array.from({ length: 1 + int(2) }, () => pick(IDENTIFIERS)).join('.')}`
	if (chance(0.08)) version = text([...'0123.-+a ^~v'], 8)
	if (chance(0.03)) version += pick(['\n', ' ', '.', '+', '-'])
	return version
}
// Small, mostly valid versions so ranges frequently match and prerelease precedence is exercised.
const SMALL = ['0', '0', '1', '1', '2']
const PRE = ['0', '1', '2', '10', 'alpha', 'beta', 'rc', 'a', 'B', '-', '1a']
const smallVersion = () => {
	let version = `${pick(SMALL)}.${pick(SMALL)}.${pick(SMALL)}`
	if (chance(0.55)) version += `-${Array.from({ length: 1 + int(3) }, () => pick(PRE)).join('.')}`
	if (chance(0.1)) version += '+build.1'
	return version
}

for (let i = 0; i < 400; i++) {
	const version = randomVersion()
	const parsed = parseSemver(version)
	const expected = parsed
		? `S,${parsed.major},${parsed.minor},${parsed.patch},${parsed.prerelease === null ? '-' : `p${hex(parsed.prerelease)}`}`
		: 'N'
	add('semver-parse', `P,${hex(version)}`, version, (answer) => assert.equal(answer, expected))
}
for (let i = 0; i < 700; i++) {
	let version = chance(0.9) ? smallVersion() : randomVersion()
	let body = chance(0.9) ? smallVersion() : randomVersion()
	if (chance(0.6)) {
		// Near miss: the range differs from the version by at most a step per component and a prerelease tag.
		const core = [int(3), int(3), int(3)]
		const near = core.map((part) => (chance(0.25) ? Math.max(0, part + pick([-1, 1])) : part))
		const ids = Array.from({ length: 1 + int(2) }, () => pick(['1', '2', '10', 'a', 'rc']))
		// The range's tag usually differs from the version's in a single identifier.
		const nearIds = chance(0.6) ? ids.with(int(ids.length), pick(['1', '2', '10', 'a', 'rc'])) : ids.slice(0, int(3))
		version = `${core.join('.')}${chance(0.5) ? `-${ids.join('.')}` : ''}`
		body = `${near.join('.')}${chance(0.5) && nearIds.length > 0 ? `-${nearIds.join('.')}` : ''}`
	}
	const range = pick(['', '', '^', '^', '^', '~', '~', '~', '>=', '=', ' ']) + body
	const expected = satisfiesRange(version, range) ? '1' : '0'
	add('semver-range', `S,${hex(version)},${hex(range)}`, { version, range }, (answer) => assert.equal(answer, expected))
}
const SPECS = [
	'workspace:*',
	'workspace:^',
	'workspace:~',
	'workspace:',
	'workspace:^1.2.3',
	'workspace:1.0.0',
	' workspace:*',
	'workspace:* ',
	'\tworkspace:^\n',
	'file:../x',
	' file:../x',
	'link:../x',
	'portal:../x',
	'FILE:x',
	'./pkg.tgz',
	'https://example.test/pkg.tgz ',
	'pkg.tgz.sig',
	'^1.2.3',
	'npm:other@1.0.0',
	'catalog:',
	'',
	'*',
]
const randomSpec = () => (chance(0.75) ? pick(SPECS) : text([...'workspace:*^~ file:link.tgz\t1'], 12))
for (let i = 0; i < 150; i++) {
	const spec = randomSpec()
	const target = smallVersion()
	const expected = resolveWorkspaceRange(spec, target)
	add('workspace-range', `W,${hex(spec)},${hex(target)}`, { spec, target }, (answer) =>
		assert.equal(unhex(answer), expected),
	)
}
for (let i = 0; i < 350; i++) {
	const spec = randomSpec()
	const field = pick(['dependencies', 'peerDependencies', 'optionalDependencies'])
	const member = pick(['public', 'private', 'absent'])
	const consumer = {
		dir: '/repo/packages/consumer',
		manifestPath: '/repo/packages/consumer/package.json',
		relDir: 'packages/consumer',
		pkg: { name: 'consumer', version: '1.0.0', [field]: { dep: spec } },
	}
	const dep = {
		dir: '/repo/packages/dep',
		manifestPath: '/repo/packages/dep/package.json',
		relDir: 'packages/dep',
		pkg: { name: 'dep', version: '1.0.0', private: member === 'private' },
	}
	const errors = validatePackageManifests(member === 'absent' ? [consumer] : [consumer, dep], { repoRoot: '/repo' })
	const label = 'consumer (packages/consumer/package.json)'
	add('protocol-leak', `D,${hex(spec)}`, { spec, field, member }, (answer) => {
		const [unpublishable, workspace] = answer.split(',').map((flag) => flag === '1')
		/** @type {string[]} */
		const expected = []
		if (unpublishable) expected.push(`${label}: ${field}.dep uses unpublishable specifier "${spec}"`)
		if (workspace && member === 'absent') {
			expected.push(`${label}: ${field}.dep uses "${spec}" but "dep" is not a workspace member`)
		}
		if (workspace && member === 'private') {
			expected.push(`${label}: ${field}.dep depends on private workspace package "dep"`)
		}
		assert.deepEqual(expected, errors)
	})
}

// Oracle run

/** @type {string[]} */
let answers = []
before(() => {
	// Always an incremental `lake build`: an edited `.lean` file is never tested as a stale binary.
	const binary = buildOracle(here, 'host-spec')
	const run = spawnSync(binary, { input: `${cases.map(({ query }) => query).join('\n')}\n`, maxBuffer: 1 << 28 })
	assert.equal(run.status, 0, `host-spec exited with ${run.status}: ${run.stderr}`)
	answers = run.stdout.toString('utf8').split('\n').slice(0, -1)
	assert.equal(answers.length, cases.length, 'host-spec must answer every query')
})

describe(`Lean host-spec oracle vs TEVM JavaScript (seed ${seed})`, () => {
	const domains = [...new Set(cases.map(({ domain }) => domain))]
	for (const domain of domains) {
		const indexes = cases.flatMap((entry, index) => (entry.domain === domain ? [index] : []))
		it(`${domain}: ${indexes.length} cases agree`, () => {
			for (const index of indexes) {
				const { check, input, query } = cases[index]
				try {
					check(answers[index])
				} catch (error) {
					throw new Error(
						`${domain} case ${index} disagrees\ninput: ${JSON.stringify(input)}\nquery: ${query}\nlean: ${answers[index]}\n${error.message}`,
						{ cause: error },
					)
				}
			}
		})
	}
	it('runs at least 2,000 differential cases', () => {
		assert.ok(cases.length >= 2000, `only ${cases.length} cases`)
		console.log(`differential cases: ${cases.length}`)
	})
	// Declared after the domain tests, so every console answer has been classified.
	it('the oracle decides nearly every console case', () => {
		const total = (domain) => cases.filter((entry) => entry.domain === domain).length
		assert.equal(unmodeled['console-lone'] ?? 0, 0, 'a lone string never needs a numeric coercion')
		// Only a string whose value a double cannot hold exactly is left undecided.
		assert.ok((unmodeled.console ?? 0) <= total('console') * 0.05, `console: ${unmodeled.console} undecided`)
		assert.ok(
			(unmodeled['console-numeric'] ?? 0) <= total('console-numeric') * 0.35,
			`console-numeric: ${unmodeled['console-numeric']} of ${total('console-numeric')} undecided`,
		)
		console.log(`console cases the oracle leaves to binary rounding: ${JSON.stringify(unmodeled)}`)
	})
})
