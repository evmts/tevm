/**
 * Property and metamorphic fuzz tests for the remappings.txt parser (`loadRemappings`)
 * and the JSONC config loader (`loadJsonConfig`).
 *
 * Self-contained: uses a seeded PRNG and a greedy shrinker instead of an external
 * property testing dependency. Override with FUZZ_SEED and FUZZ_RUNS.
 */
import { join } from 'node:path'
import { either, runSync } from 'effect/Effect'
import { describe, expect, it, vi } from 'vitest'
import { loadJsonConfig } from './json/loadJsonConfig.js'
import { loadRemappings } from './json/loadRemappingstxt.js'

// ---------------------------------------------------------------------------
// virtual file system
// ---------------------------------------------------------------------------

const vfs = vi.hoisted(() => ({ files: new Map<string, string>() }))

vi.mock('node:fs', () => ({
	readFileSync: (file: string) => {
		const content = vfs.files.get(file)
		if (content === undefined) {
			throw new Error(`ENOENT: no such file or directory, open '${file}'`)
		}
		return content
	},
	existsSync: (file: string) => vfs.files.has(file),
}))

// ---------------------------------------------------------------------------
// seeded property testing helpers
// ---------------------------------------------------------------------------

const SEED = Number(process.env['FUZZ_SEED'] ?? 0x7e5d2026) >>> 0
const RUNS = Math.max(1, Number(process.env['FUZZ_RUNS'] ?? 400))

type Rng = {
	next: () => number
	int: (min: number, max: number) => number
	bool: (probability?: number) => boolean
	pick: <T>(values: ReadonlyArray<T>) => T
}

const makeRng = (seed: number): Rng => {
	let state = seed >>> 0
	const next = () => {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
	const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
	return {
		next,
		int,
		bool: (probability = 0.5) => next() < probability,
		pick: (values) => values[int(0, values.length - 1)] as (typeof values)[number],
	}
}

const hash = (text: string) => {
	let h = 2166136261
	for (let i = 0; i < text.length; i++) {
		h = Math.imul(h ^ text.charCodeAt(i), 16777619)
	}
	return h >>> 0
}

const failure = (property: (value: never) => void, value: unknown): Error | undefined => {
	try {
		;(property as (value: unknown) => void)(value)
		return undefined
	} catch (e) {
		return e instanceof Error ? e : new Error(String(e))
	}
}

/**
 * Runs `property` against `runs` generated values. On failure, greedily shrinks the
 * counterexample with `shrink` and reports the seed needed to reproduce it.
 */
const forAll = <T>(
	name: string,
	generate: (rng: Rng) => T,
	property: (value: T) => void,
	shrink: (value: T) => Iterable<T> = () => [],
	runs = RUNS,
) => {
	for (let run = 0; run < runs; run++) {
		const caseSeed = (SEED ^ hash(name) ^ Math.imul(run + 1, 0x9e3779b9)) >>> 0
		let value = generate(makeRng(caseSeed))
		let error = failure(property, value)
		if (!error) continue
		let steps = 0
		let progress = true
		while (progress && steps < 2000) {
			progress = false
			for (const candidate of shrink(value)) {
				steps++
				const candidateError = failure(property, candidate)
				if (candidateError) {
					value = candidate
					error = candidateError
					progress = true
					break
				}
			}
		}
		throw new Error(
			`Property "${name}" failed on run ${run} (FUZZ_SEED=${SEED}).\nShrunk counterexample: ${JSON.stringify(value)}\n${error.stack}`,
		)
	}
}

/** Shrinks an array by removing one element at a time */
function* removeEach<T>(values: ReadonlyArray<T>): Iterable<T[]> {
	for (let i = 0; i < values.length; i++) {
		yield [...values.slice(0, i), ...values.slice(i + 1)]
	}
}

// ---------------------------------------------------------------------------
// generators
// ---------------------------------------------------------------------------

const ASCII_SEGMENT = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.@$'
// None of these are whitespace or line terminators for String.prototype.trim
const UNICODE_SEGMENT = ['é', 'ß', '日本', '路径', 'Ω', 'ñ', '🚀', 'ü', 'д', 'ك', 'ç', '한']

const genSegment = (rng: Rng) => {
	let segment = ''
	const length = rng.int(1, 6)
	for (let i = 0; i < length; i++) {
		segment += rng.bool(0.15) ? rng.pick(UNICODE_SEGMENT) : ASCII_SEGMENT[rng.int(0, ASCII_SEGMENT.length - 1)]
	}
	return segment
}

type Entry = { prefix: string; target: string }

const genPrefix = (rng: Rng) => {
	const segments = Array.from({ length: rng.int(1, 3) }, () => genSegment(rng))
	const context = rng.bool(0.1) ? `${genSegment(rng)}:` : ''
	const prefix = `${context}${rng.bool(0.4) ? '@' : ''}${segments.join('/')}${rng.bool(0.8) ? '/' : ''}`
	// `__proto__` is not representable as a plain record key through schema validation
	return prefix === '__proto__' ? '__proto__/' : prefix
}

const genTarget = (rng: Rng) => {
	const separator = rng.bool(0.2) ? '\\' : '/'
	const segments = Array.from({ length: rng.int(1, 4) }, () => {
		let segment = genSegment(rng)
		// `=` and inner spaces are legal in paths: only the first `=` of a line separates
		if (rng.bool(0.2)) segment += `=${genSegment(rng)}`
		if (rng.bool(0.1)) segment += ` ${genSegment(rng)}`
		if (rng.bool(0.05)) segment = '..'
		return segment
	})
	const leading = rng.pick(['', '', '', '/', '//', '\\', './'])
	const drive = rng.bool(0.05) ? 'C:\\' : ''
	const trailing = rng.bool(0.7) ? separator : ''
	return `${drive}${leading}${segments.join(separator)}${trailing}`
}

const genEntries = (rng: Rng, max = 8): Entry[] =>
	Array.from({ length: rng.int(1, max) }, () => ({ prefix: genPrefix(rng), target: genTarget(rng) }))

/** Overlapping prefixes: every prefix of the chain is itself a remapping */
const genOverlappingEntries = (rng: Rng): Entry[] => {
	const entries: Entry[] = []
	let prefix = rng.bool() ? '@' : ''
	const depth = rng.int(2, 5)
	for (let i = 0; i < depth; i++) {
		prefix += `${genSegment(rng)}/`
		entries.push({ prefix, target: genTarget(rng) })
	}
	return entries
}

const CONFIG_DIRS = [
	'/project',
	'/project/',
	'/path with space/to/config',
	'/home/üser/日本/proj',
	'C:\\Users\\dev\\project',
	'C:\\Users\\dev\\project\\',
	'C:\\mixed/separators',
	'relative/dir',
	'/',
]

const EOLS = ['\n', '\r\n', '\r']
const PADDING = ['', '', ' ', '  ', '\t', ' \t ']

type Noise = { eol: string; bom: boolean; lead: string[]; trail: string[]; blanks: string[][]; tail: string }

const genNoise = (rng: Rng, lines: number): Noise => ({
	eol: rng.pick(EOLS),
	bom: rng.bool(0.1),
	lead: Array.from({ length: lines }, () => rng.pick(PADDING)),
	trail: Array.from({ length: lines }, () => rng.pick(PADDING)),
	blanks: Array.from({ length: lines + 1 }, () => Array.from({ length: rng.int(0, 2) }, () => rng.pick(PADDING))),
	tail: rng.pick(['', '\n', '\r\n', '\n\n', ' ', '\t\n']),
})

const NO_NOISE = (lines: number): Noise => ({
	eol: '\n',
	bom: false,
	lead: Array.from({ length: lines }, () => ''),
	trail: Array.from({ length: lines }, () => ''),
	blanks: Array.from({ length: lines + 1 }, () => []),
	tail: '',
})

const render = (entries: ReadonlyArray<Entry>, noise: Noise) => {
	const lines: string[] = []
	entries.forEach(({ prefix, target }, i) => {
		lines.push(...(noise.blanks[i] ?? []))
		lines.push(`${noise.lead[i] ?? ''}${prefix}=${target}${noise.trail[i] ?? ''}`)
	})
	lines.push(...(noise.blanks[entries.length] ?? []))
	return `${noise.bom ? '\uFEFF' : ''}${lines.join(noise.eol)}${noise.tail}`
}

// ---------------------------------------------------------------------------
// system under test + independent oracle
// ---------------------------------------------------------------------------

const baseDirOf = (configDir: string) => {
	if (configDir.endsWith('/') || configDir.endsWith('\\')) return configDir
	return `${configDir}${configDir.includes('\\') && !configDir.includes('/') ? '\\' : '/'}`
}

const expectedRemappings = (configDir: string, entries: ReadonlyArray<Entry>) => {
	const expected: Record<string, string> = {}
	for (const { prefix, target } of entries) {
		expected[prefix] = `${baseDirOf(configDir)}${target.replace(/^[/\\]+/, '')}`
	}
	return expected
}

const joinPath = (configDir: string, file: string) => join(configDir, file)

const parseRemappings = (configDir: string, content: string) => {
	vfs.files.clear()
	vfs.files.set(joinPath(configDir, 'remappings.txt'), content)
	return runSync(either(loadRemappings(configDir)))
}

const parseOk = (configDir: string, content: string) => {
	const result = parseRemappings(configDir, content)
	if (result._tag === 'Left') {
		throw new Error(`Expected remappings to parse but got ${result.left.name}: ${result.left.message}`)
	}
	return result.right
}

type RemappingCase = { configDir: string; entries: Entry[]; noise: Noise }

const genCase = (rng: Rng): RemappingCase => {
	const entries = rng.bool(0.25) ? genOverlappingEntries(rng) : genEntries(rng)
	return { configDir: rng.pick(CONFIG_DIRS), entries, noise: genNoise(rng, entries.length) }
}

function* shrinkCase(value: RemappingCase): Iterable<RemappingCase> {
	for (const entries of removeEach(value.entries)) {
		if (entries.length > 0) yield { ...value, entries }
	}
	const quiet = NO_NOISE(value.entries.length)
	if (JSON.stringify(quiet) !== JSON.stringify(value.noise)) yield { ...value, noise: quiet }
	if (value.configDir !== '/project') yield { ...value, configDir: '/project' }
}

describe('remappings.txt parser fuzz', () => {
	it(`parses every well formed file to the oracle model (${RUNS} runs)`, () => {
		forAll(
			'remappings model equivalence',
			genCase,
			({ configDir, entries, noise }) => {
				const config = parseOk(configDir, render(entries, noise))
				expect(config).toEqual({ remappings: expectedRemappings(configDir, entries) })
				// one key per distinct prefix. Key order is not asserted: JavaScript objects order
				// integer-like keys such as `4` first, and resolution sorts prefixes by length.
				expect(Object.keys(config.remappings ?? {}).sort()).toEqual(
					[...new Set(entries.map(({ prefix }) => prefix))].sort(),
				)
			},
			shrinkCase,
		)
	})

	it(`is deterministic and invariant under line ending, padding, blank line and BOM noise (${RUNS} runs)`, () => {
		forAll(
			'remappings noise invariance',
			(rng) => {
				const base = genCase(rng)
				return { ...base, otherNoise: genNoise(rng, base.entries.length) }
			},
			({ configDir, entries, noise, otherNoise }) => {
				const canonical = parseOk(configDir, render(entries, NO_NOISE(entries.length)))
				const first = parseOk(configDir, render(entries, noise))
				const again = parseOk(configDir, render(entries, noise))
				const other = parseOk(configDir, render(entries, otherNoise))
				expect(again).toEqual(first)
				expect(first).toEqual(canonical)
				expect(other).toEqual(canonical)
				for (const eol of EOLS) {
					expect(parseOk(configDir, render(entries, { ...noise, eol }))).toEqual(canonical)
				}
			},
			function* (value) {
				for (const smaller of shrinkCase(value)) yield { ...smaller, otherNoise: value.otherNoise }
			},
		)
	})

	it(`normalizes targets under the config directory with a single separator (${RUNS} runs)`, () => {
		forAll(
			'remappings path normalization',
			genCase,
			({ configDir, entries, noise }) => {
				const { remappings = {} } = parseOk(configDir, render(entries, noise))
				const baseDir = baseDirOf(configDir)
				for (const [prefix, target] of Object.entries(remappings)) {
					expect(prefix.length).toBeGreaterThan(0)
					expect(prefix).toBe(prefix.trim())
					expect(prefix).not.toContain('=')
					expect(target.startsWith(baseDir)).toBe(true)
					// leading separators of the target never produce `dir//target`
					expect(target.slice(baseDir.length)).not.toMatch(/^[/\\]/)
					expect(target).not.toMatch(/[\r\n]/)
					expect(target).toBe(target.trimEnd())
				}
			},
			shrinkCase,
		)
	})

	it(`round trips: serializing a parsed config and parsing it again is a fixed point (${RUNS} runs)`, () => {
		forAll(
			'remappings round trip',
			(rng) => ({ ...genCase(rng), eol: rng.pick(EOLS) }),
			({ configDir, entries, noise, eol }) => {
				const parsed = parseOk(configDir, render(entries, noise))
				const baseDir = baseDirOf(configDir)
				const serialized = Object.entries(parsed.remappings ?? {})
					.map(([prefix, target]) => `${prefix}=${target.slice(baseDir.length)}`)
					.join(eol)
				const reparsed = parseOk(configDir, serialized)
				expect(reparsed).toEqual(parsed)
				expect(Object.keys(reparsed.remappings ?? {})).toEqual(Object.keys(parsed.remappings ?? {}))
			},
			function* (value) {
				for (const smaller of shrinkCase(value)) yield { ...smaller, eol: value.eol }
			},
		)
	})

	it(`keeps every overlapping prefix and is independent of line order (${RUNS} runs)`, () => {
		forAll(
			'remappings overlapping prefixes',
			(rng) => {
				const entries = genOverlappingEntries(rng)
				const shuffled = [...entries]
				for (let i = shuffled.length - 1; i > 0; i--) {
					const j = rng.int(0, i)
					;[shuffled[i], shuffled[j]] = [shuffled[j] as Entry, shuffled[i] as Entry]
				}
				return { configDir: rng.pick(CONFIG_DIRS), entries, shuffled, noise: genNoise(rng, entries.length) }
			},
			({ configDir, entries, shuffled, noise }) => {
				const ordered = parseOk(configDir, render(entries, noise))
				const reordered = parseOk(configDir, render(shuffled, noise))
				expect(Object.keys(ordered.remappings ?? {})).toHaveLength(entries.length)
				expect(reordered).toEqual(ordered)
			},
		)
	})

	it(`lets the last duplicate prefix win (${RUNS} runs)`, () => {
		forAll(
			'remappings duplicate prefixes',
			(rng) => {
				const entries = genEntries(rng, 5)
				const duplicate = { prefix: rng.pick(entries).prefix, target: genTarget(rng) }
				return { configDir: rng.pick(CONFIG_DIRS), entries: [...entries, duplicate] }
			},
			({ configDir, entries }) => {
				const config = parseOk(configDir, render(entries, NO_NOISE(entries.length)))
				const last = entries[entries.length - 1] as Entry
				expect(config.remappings?.[last.prefix]).toBe(expectedRemappings(configDir, [last])[last.prefix])
				expect(Object.keys(config.remappings ?? {})).toHaveLength(new Set(entries.map(({ prefix }) => prefix)).size)
			},
		)
	})

	it(`never crashes on malformed input and only fails with InvalidRemappingsError (${RUNS * 2} runs)`, () => {
		const GARBAGE = [
			'=',
			'==',
			'\n',
			'\r',
			'\r\n',
			' ',
			'\t',
			'\0',
			'#',
			'# comment',
			'// comment',
			'/* c */',
			'a',
			'@lib/',
			'lib/x/',
			'\\',
			'/',
			':',
			'"',
			"'",
			'\uFEFF',
			'\u2028',
			'\u00a0',
			'\ud800',
			'\udc00',
			'🚀',
			'日本',
			'$&',
			'%00',
			'__proto__',
			'constructor',
			'toString',
			',',
			'{',
			'}',
		]
		forAll(
			'remappings malformed input',
			(rng) => ({
				configDir: rng.pick(CONFIG_DIRS),
				tokens: Array.from({ length: rng.int(0, 14) }, () => rng.pick(GARBAGE)),
			}),
			({ configDir, tokens }) => {
				const content = tokens.join('')
				// runSync throws on defects and unexpected exceptions
				const result = parseRemappings(configDir, content)
				expect(parseRemappings(configDir, content)).toEqual(result)
				const lines = content
					.trim()
					.split(/\r\n|\r|\n/)
					.map((line) => line.trim())
					.filter((line) => line.length > 0)
				if (result._tag === 'Left') {
					expect(result.left._tag).toBe('InvalidRemappingsError')
					expect(result.left).toBeInstanceOf(TypeError)
					// a failure always has a line that is not `prefix=target`
					expect(lines.some((line) => line.indexOf('=') < 1)).toBe(true)
					return
				}
				// success means every non blank line is `prefix=target` with a non empty prefix
				expect(lines.every((line) => line.indexOf('=') >= 1)).toBe(true)
				const remappings = result.right.remappings ?? {}
				expect(Object.keys(remappings).length).toBeLessThanOrEqual(lines.length)
				for (const [prefix, target] of Object.entries(remappings)) {
					expect(prefix.length).toBeGreaterThan(0)
					expect(typeof target).toBe('string')
					expect(target.startsWith(baseDirOf(configDir))).toBe(true)
				}
			},
			function* (value) {
				for (const tokens of removeEach(value.tokens)) yield { ...value, tokens }
			},
			RUNS * 2,
		)
	})

	it('returns an empty config for missing, empty and whitespace only files', () => {
		vfs.files.clear()
		expect(runSync(loadRemappings('/project'))).toEqual({})
		for (const content of ['', ' ', '\n', '\r\n\r\n', '\t \r \n', '\uFEFF', '\uFEFF\n']) {
			expect(parseOk('/project', content)).toEqual({})
		}
	})

	describe('regressions found by fuzzing', () => {
		it('keeps `=` characters inside the target path', () => {
			expect(parseOk('/project', '@lib/=lib/a=b/src/')).toEqual({
				remappings: { '@lib/': '/project/lib/a=b/src/' },
			})
			expect(parseOk('/project', 'a=b=c==')).toEqual({ remappings: { a: '/project/b=c==' } })
		})

		it('rejects an empty prefix that would hijack every import', () => {
			const result = parseRemappings('/project', '@ok/=lib/ok/\n=lib/everything/')
			expect(result._tag).toBe('Left')
			expect(result._tag === 'Left' && result.left._tag).toBe('InvalidRemappingsError')
		})

		it('splits lone carriage return line endings', () => {
			expect(parseOk('/project', 'a/=x/\rb/=y/')).toEqual({
				remappings: { 'a/': '/project/x/', 'b/': '/project/y/' },
			})
		})
	})
})

// ---------------------------------------------------------------------------
// JSONC config loader
// ---------------------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const genText = (rng: Rng) => {
	const parts = ['"', '\\', '/', '\n', '\t', ' ', '//', '/*', '*/', ',', '}', ']', '\u2028', 'é', '日本', '🚀', '=']
	let text = ''
	const length = rng.int(0, 5)
	for (let i = 0; i < length; i++) {
		text += rng.bool(0.3) ? rng.pick(parts) : genSegment(rng)
	}
	return text
}

const genCompilerConfig = (rng: Rng) => {
	const config: { [key: string]: Json } = {}
	if (rng.bool(0.8)) {
		const remappings: { [key: string]: Json } = {}
		const count = rng.int(0, 5)
		for (let i = 0; i < count; i++) {
			remappings[`${genPrefix(rng)}${genText(rng)}`] = genText(rng)
		}
		delete remappings['__proto__']
		config['remappings'] = remappings
	}
	if (rng.bool(0.6)) config['libs'] = Array.from({ length: rng.int(0, 4) }, () => genText(rng))
	if (rng.bool(0.4)) config['debug'] = rng.bool()
	if (rng.bool(0.4)) config['cacheDir'] = genText(rng)
	if (rng.bool(0.4)) config['foundryProject'] = rng.bool() ? rng.bool() : genText(rng)
	if (rng.bool(0.3)) {
		config['jsonAsConst'] = rng.bool() ? genText(rng) : Array.from({ length: rng.int(0, 3) }, () => genText(rng))
	}
	if (rng.bool(0.2)) config['name'] = '@tevm/ts-plugin'
	return config
}

/** Serializes JSON with random whitespace, comments and trailing commas between tokens */
const renderJsonc = (value: Json, rng: Rng): string => {
	const gap = () => {
		let out = ''
		const count = rng.int(0, 2)
		for (let i = 0; i < count; i++) {
			const kind = rng.int(0, 5)
			if (kind === 0) out += ' '
			else if (kind === 1) out += rng.pick(['\n', '\r\n'])
			else if (kind === 2) out += '\t'
			else if (kind === 3) out += `/* ${rng.pick(['note', '"quoted"', '{ , ] //', '日本 🚀', '*', '/ *'])} */`
			else if (kind === 4)
				out += `// ${rng.pick(['line', '"k": 1,', '/* open', '日本', '}'])}${rng.pick(['\n', '\r\n'])}`
			else out += ''
		}
		return out
	}
	const trailingComma = () => (rng.bool(0.4) ? `${gap()},` : '')
	const go = (node: Json): string => {
		if (Array.isArray(node)) {
			if (node.length === 0) return `[${gap()}]`
			return `[${node.map((item) => `${gap()}${go(item)}`).join(`${gap()},`)}${trailingComma()}${gap()}]`
		}
		if (node !== null && typeof node === 'object') {
			const entries = Object.entries(node)
			if (entries.length === 0) return `{${gap()}}`
			return `{${entries
				.map(([key, item]) => `${gap()}${JSON.stringify(key)}${gap()}:${gap()}${go(item)}`)
				.join(`${gap()},`)}${trailingComma()}${gap()}}`
		}
		return JSON.stringify(node)
	}
	return `${gap()}${go(value)}${gap()}`
}

const loadJson = (content: string, file = 'tevm.config.json') => {
	vfs.files.clear()
	vfs.files.set(joinPath('/project', file), content)
	return runSync(either(loadJsonConfig('/project')))
}

describe('JSONC config loader fuzz', () => {
	it(`decodes JSONC with comments, trailing commas and mixed line endings to the plain JSON value (${RUNS} runs)`, () => {
		forAll(
			'jsonc equivalence',
			(rng) => {
				const config = genCompilerConfig(rng)
				return { config, jsonc: renderJsonc(config, rng), file: rng.pick(['tevm.config.json', 'tevm.json']) }
			},
			({ config, jsonc, file }) => {
				const plain = loadJson(JSON.stringify(config), file)
				const noisy = loadJson(jsonc, file)
				expect(plain._tag).toBe('Right')
				expect(noisy).toEqual(plain)
				expect(loadJson(jsonc, file)).toEqual(noisy)
				if (noisy._tag === 'Right') {
					expect(noisy.right).toEqual(config)
					// round trip: the decoded config serializes back to an equivalent config
					expect(loadJson(JSON.stringify(noisy.right), file)).toEqual(noisy)
				}
			},
		)
	})

	it(`never crashes on mutated JSONC and only fails with typed errors (${RUNS * 2} runs)`, () => {
		const INSERTS = [
			'{',
			'}',
			'[',
			']',
			',',
			':',
			'"',
			'//',
			'/*',
			'*/',
			'\\',
			'\n',
			'\0',
			'null',
			'1e999',
			'-',
			'\ud800',
			'🚀',
		]
		forAll(
			'jsonc malformed input',
			(rng) => {
				let text = renderJsonc(genCompilerConfig(rng), rng)
				const mutations = rng.int(1, 4)
				for (let i = 0; i < mutations; i++) {
					const at = rng.int(0, text.length)
					const kind = rng.int(0, 2)
					if (kind === 0) text = text.slice(0, at)
					else if (kind === 1) text = `${text.slice(0, at)}${rng.pick(INSERTS)}${text.slice(at)}`
					else text = `${text.slice(0, at)}${text.slice(at + rng.int(1, 4))}`
				}
				return text
			},
			(text) => {
				const result = loadJson(text)
				expect(loadJson(text)).toEqual(result)
				if (result._tag === 'Left') {
					expect(['InvalidJsonConfigError', 'InvalidConfigError']).toContain(result.left._tag)
					return
				}
				expect(typeof result.right).toBe('object')
				for (const [prefix, target] of Object.entries(result.right.remappings ?? {})) {
					expect(typeof prefix).toBe('string')
					expect(typeof target).toBe('string')
				}
			},
			function* (text) {
				for (let i = 0; i < text.length; i++) yield `${text.slice(0, i)}${text.slice(i + 1)}`
			},
			RUNS * 2,
		)
	})

	it('fails with FailedToReadConfigError when no config file exists', () => {
		vfs.files.clear()
		const result = runSync(either(loadJsonConfig('/project')))
		expect(result._tag === 'Left' && result.left._tag).toBe('FailedToReadConfigError')
	})
})
