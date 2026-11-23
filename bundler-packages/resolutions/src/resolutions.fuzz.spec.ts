/**
 * Property and metamorphic fuzz tests for Solidity import resolution
 * (`moduleFactory`, `resolveImports`, `resolveImportPath`, `updateImportPaths`).
 *
 * Random import graphs (DAGs, diamonds, self imports, cycles) are written to an in-memory
 * file system and resolved through relative paths and arbitrary remappings.
 *
 * Self-contained: uses a seeded PRNG and a greedy shrinker instead of an external
 * property testing dependency. Override with FUZZ_SEED and FUZZ_RUNS.
 */
import { posix } from 'node:path'
import { either, runPromise, runSync } from 'effect/Effect'
import { describe, expect, it } from 'vitest'
import { moduleFactory } from './moduleFactory.js'
import { resolveImports } from './resolveImports.js'
import type { FileAccessObject, ModuleInfo } from './types.js'
import { resolveImportPath } from './utils/resolveImportPath.js'
import { updateImportPaths } from './utils/updateImportPath.js'

// ---------------------------------------------------------------------------
// seeded property testing helpers
// ---------------------------------------------------------------------------

const SEED = Number(process.env['FUZZ_SEED'] ?? 0x7e5d2026) >>> 0
const RUNS = Math.max(1, Number(process.env['FUZZ_RUNS'] ?? 300))

type Rng = {
	next: () => number
	int: (min: number, max: number) => number
	bool: (probability?: number) => boolean
	pick: <T>(values: ReadonlyArray<T>) => T
	shuffle: <T>(values: ReadonlyArray<T>) => T[]
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
		shuffle: (values) => {
			const out = [...values]
			for (let i = out.length - 1; i > 0; i--) {
				const j = int(0, i)
				;[out[i], out[j]] = [out[j] as (typeof out)[number], out[i] as (typeof out)[number]]
			}
			return out
		},
	}
}

const hash = (text: string) => {
	let h = 2166136261
	for (let i = 0; i < text.length; i++) {
		h = Math.imul(h ^ text.charCodeAt(i), 16777619)
	}
	return h >>> 0
}

const failure = async <T>(property: (value: T) => void | Promise<void>, value: T): Promise<Error | undefined> => {
	try {
		await property(value)
		return undefined
	} catch (e) {
		return e instanceof Error ? e : new Error(String(e))
	}
}

/**
 * Runs `property` against `runs` generated values. On failure, greedily shrinks the
 * counterexample with `shrink` and reports the seed needed to reproduce it.
 */
const forAll = async <T>(
	name: string,
	generate: (rng: Rng) => T,
	property: (value: T) => void | Promise<void>,
	shrink: (value: T) => Iterable<T> = () => [],
	runs = RUNS,
) => {
	for (let run = 0; run < runs; run++) {
		const caseSeed = (SEED ^ hash(name) ^ Math.imul(run + 1, 0x9e3779b9)) >>> 0
		let value = generate(makeRng(caseSeed))
		let error = await failure(property, value)
		if (!error) continue
		let steps = 0
		let progress = true
		while (progress && steps < 1000) {
			progress = false
			for (const candidate of shrink(value)) {
				steps++
				const candidateError = await failure(property, candidate)
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

// ---------------------------------------------------------------------------
// import graph generators
// ---------------------------------------------------------------------------

const ROOT = '/tevm-fuzz-vfs'
const SEGMENTS = [
	'src',
	'lib',
	'contracts',
	'utils',
	'a',
	'b',
	'with space',
	'日本',
	'ünï',
	'dot.dir',
	'@scope',
	'node_modules',
	// `$` sequences are replacement patterns for String.prototype.replace
	'$&',
	"$'",
	'$1',
	'$$',
	'$`',
]

type ImportStyle = 'plain' | 'named' | 'star' | 'alias' | 'single' | 'indented' | 'multiline' | 'afterComment'
const IMPORT_STYLES: ReadonlyArray<ImportStyle> = [
	'plain',
	'named',
	'star',
	'alias',
	'single',
	'indented',
	'multiline',
	'afterComment',
]

type Edge = {
	/** index of the imported file */
	to: number
	/** import through a remapping prefix instead of a relative path */
	remapped: boolean
	style: ImportStyle
}
type Remapping = { prefix: string; dir: string }
type Graph = {
	files: string[]
	edges: Edge[][]
	remappings: Remapping[]
	/** insert commented out imports of files that do not exist */
	ghosts: boolean[]
	pragmaFirst: boolean[]
	entry: number
}

type Shape = 'dag' | 'diamond' | 'cyclic' | 'chain' | 'ring'

const genDir = (rng: Rng) => {
	const depth = rng.int(0, 3)
	return [ROOT, ...Array.from({ length: depth }, () => rng.pick(SEGMENTS))].join('/')
}

const genGraph = (rng: Rng, shape: Shape = rng.pick(['dag', 'diamond', 'cyclic', 'chain', 'ring'])): Graph => {
	const count = shape === 'diamond' ? 4 * rng.int(1, 2) : rng.int(1, 10)
	const files: string[] = []
	while (files.length < count) {
		const file = `${genDir(rng)}/C${files.length}${rng.pick(['', '.t', '-v2', ' copy', '$'])}.sol`
		if (!files.includes(file)) files.push(file)
	}
	const targets: number[][] = files.map(() => [])
	const add = (from: number, to: number) => (targets[from] as number[]).push(to)
	for (let i = 0; i < count; i++) {
		if (shape === 'dag') {
			for (let j = i + 1; j < count; j++) if (rng.bool(0.35)) add(i, j)
		} else if (shape === 'diamond') {
			// top -> left, right -> bottom, repeated
			if (i % 4 === 0) {
				add(i, i + 1)
				add(i, i + 2)
				add(i + 1, i + 3)
				add(i + 2, i + 3)
				if (i + 4 < count) add(i + 3, i + 4)
			}
		} else if (shape === 'chain') {
			if (i + 1 < count) add(i, i + 1)
		} else if (shape === 'ring') {
			add(i, (i + 1) % count)
		} else {
			for (let j = 0; j < count; j++) if (rng.bool(0.3)) add(i, j)
			// self import
			if (rng.bool(0.2)) add(i, i)
		}
		// duplicate import statements for the same file
		if ((targets[i] as number[]).length > 0 && rng.bool(0.2)) add(i, rng.pick(targets[i] as number[]))
	}

	// remappings point at directories that contain generated files, with overlapping prefixes
	const remappings: Remapping[] = []
	const dirs = [...new Set(files.map((file) => posix.dirname(file)))]
	const remappingCount = rng.int(0, 4)
	for (let i = 0; i < remappingCount; i++) {
		const dir = rng.pick(dirs)
		const base = rng.pick(['@lib/', 'forge-std/', 'src/', '@scope/pkg/', 'ünï/', 'ctx:lib/', 'solmate'])
		const overlapping = remappings.find(({ prefix }) => rng.bool(0.5) && prefix.endsWith('/'))
		const prefix = overlapping ? `${overlapping.prefix}${rng.pick(['sub/', 'x/', 'deep/er/'])}` : base
		if (!remappings.some((remapping) => remapping.prefix === prefix)) {
			// a remapping target may or may not end with a separator
			remappings.push({ prefix, dir: prefix.endsWith('/') && rng.bool(0.8) ? `${dir}/` : dir })
		}
	}

	const edges = targets.map((list) =>
		rng.shuffle(list).map((to) => ({ to, remapped: rng.bool(0.5), style: rng.pick(IMPORT_STYLES) })),
	)
	return {
		files,
		edges,
		remappings,
		ghosts: files.map(() => rng.bool(0.3)),
		pragmaFirst: files.map(() => rng.bool(0.7)),
		entry: shape === 'cyclic' || shape === 'ring' ? rng.int(0, count - 1) : 0,
	}
}

function* shrinkGraph(graph: Graph): Iterable<Graph> {
	// remove one edge
	for (let from = 0; from < graph.edges.length; from++) {
		const list = graph.edges[from] as Edge[]
		for (let i = 0; i < list.length; i++) {
			const edges = graph.edges.map((other, index) =>
				index === from ? [...list.slice(0, i), ...list.slice(i + 1)] : other,
			)
			yield { ...graph, edges }
		}
	}
	// simplify edges
	for (let from = 0; from < graph.edges.length; from++) {
		const list = graph.edges[from] as Edge[]
		for (let i = 0; i < list.length; i++) {
			const edge = list[i] as Edge
			if (edge.style !== 'plain' || edge.remapped) {
				const edges = graph.edges.map((other, index) =>
					index === from
						? list.map((e, k) => (k === i ? { ...e, style: 'plain' as const, remapped: false } : e))
						: other,
				)
				yield { ...graph, edges }
			}
		}
	}
	for (let i = 0; i < graph.remappings.length; i++) {
		yield { ...graph, remappings: [...graph.remappings.slice(0, i), ...graph.remappings.slice(i + 1)] }
	}
	if (graph.ghosts.some(Boolean)) yield { ...graph, ghosts: graph.ghosts.map(() => false) }
}

// ---------------------------------------------------------------------------
// rendering + oracle
// ---------------------------------------------------------------------------

const toRecord = (remappings: ReadonlyArray<Remapping>) =>
	Object.fromEntries(remappings.map(({ prefix, dir }) => [prefix, dir]))

/** Oracle: the longest matching remapping prefix wins */
const expectedRemap = (specifier: string, remappings: ReadonlyArray<Remapping>) => {
	const match = remappings
		.filter(({ prefix }) => specifier.startsWith(prefix))
		.sort((a, b) => b.prefix.length - a.prefix.length)[0]
	return match ? posix.resolve(`${match.dir}${specifier.slice(match.prefix.length)}`) : undefined
}

/**
 * Finds the import specifier for an edge. Remapped specifiers are only used when the
 * oracle agrees the remapping lands on the target file, otherwise the edge is relative.
 */
const specifierFor = (graph: Graph, from: number, edge: Edge) => {
	const fromFile = graph.files[from] as string
	const toFile = graph.files[edge.to] as string
	if (edge.remapped) {
		for (const { prefix, dir } of graph.remappings) {
			const base = dir.endsWith('/') ? dir : `${dir}/`
			if (!toFile.startsWith(base) || !dir.endsWith('/')) continue
			const specifier = `${prefix}${toFile.slice(base.length)}`
			if (expectedRemap(specifier, graph.remappings) === toFile) return specifier
		}
	}
	const relative = posix.relative(posix.dirname(fromFile), toFile)
	const specifier = relative.startsWith('.') ? relative : `./${relative}`
	// a relative specifier must not be captured by a remapping prefix
	return expectedRemap(specifier, graph.remappings) === undefined ? specifier : undefined
}

const renderImport = (specifier: string, style: ImportStyle, index: number) => {
	if (style === 'named') return `import { C${index} } from "${specifier}";`
	if (style === 'star') return `import * as M${index} from '${specifier}';`
	if (style === 'alias') return `import "${specifier}" as A${index};`
	if (style === 'single') return `import '${specifier}';`
	if (style === 'indented') return `\t  import "${specifier}" ;`
	if (style === 'multiline') return `import {\n\tC${index},\n\tD${index} as E${index}\n} from "${specifier}";`
	if (style === 'afterComment') return `/* license */ import "${specifier}";`
	return `import "${specifier}";`
}

type Rendered = {
	sources: Map<string, string>
	/** expected absolute import targets per file, in statement order */
	imports: Map<string, string[]>
	/** original specifiers per file, in statement order */
	specifiers: Map<string, string[]>
}

const renderGraph = (graph: Graph): Rendered => {
	const sources = new Map<string, string>()
	const imports = new Map<string, string[]>()
	const specifiers = new Map<string, string[]>()
	graph.files.forEach((file, from) => {
		const lines: string[] = ['// SPDX-License-Identifier: MIT']
		const pragma = 'pragma solidity ^0.8.20;'
		if (graph.pragmaFirst[from]) lines.push(pragma)
		const targets: string[] = []
		const originals: string[] = []
		;(graph.edges[from] as Edge[]).forEach((edge, index) => {
			const specifier = specifierFor(graph, from, edge)
			if (specifier === undefined) return
			// a path with an apostrophe is only valid Solidity inside double quotes
			const hasApostrophe = `${specifier}${graph.files[edge.to]}`.includes("'")
			const style = hasApostrophe && (edge.style === 'star' || edge.style === 'single') ? 'plain' : edge.style
			lines.push(renderImport(specifier, style, index))
			targets.push(graph.files[edge.to] as string)
			originals.push(specifier)
		})
		if (graph.ghosts[from]) {
			lines.push('// import "./Ghost.sol";')
			lines.push('/* import "./Ghost.sol"; */')
			lines.push('/*\nimport "./Ghost.sol";\n  import { Ghost } from "@lib/Ghost.sol";\n*/')
			lines.push('/// @notice import "./Ghost.sol";')
			lines.push('string constant importNote = "import ./Ghost.sol";')
		}
		if (!graph.pragmaFirst[from]) lines.push(pragma)
		lines.push(`contract C${from} { function importer() external {} }`)
		sources.set(file, lines.join('\n'))
		imports.set(file, targets)
		specifiers.set(file, originals)
	})
	return { sources, imports, specifiers }
}

const reachable = (entry: string, imports: Map<string, string[]>) => {
	const seen = new Set<string>()
	const stack = [entry]
	while (stack.length > 0) {
		const file = stack.pop() as string
		if (seen.has(file)) continue
		seen.add(file)
		stack.push(...(imports.get(file) ?? []))
	}
	return seen
}

const makeFao = (sources: Map<string, string>) => {
	const reads: string[] = []
	const read = (file: string) => {
		reads.push(file)
		const source = sources.get(file)
		if (source === undefined) throw new Error(`ENOENT: no such file or directory, open '${file}'`)
		return source
	}
	const fao: FileAccessObject = {
		readFile: async (file) => read(file),
		readFileSync: (file) => read(file),
		exists: async (file) => sources.has(file),
		existsSync: (file) => sources.has(file),
	}
	return { fao, reads }
}

const run = (
	graph: Graph,
	rendered: Rendered,
	sync: boolean,
	remappings = toRecord(graph.remappings),
	entry = graph.entry,
) => {
	const { fao, reads } = makeFao(rendered.sources)
	const entryFile = graph.files[entry] as string
	const effect = moduleFactory(entryFile, rendered.sources.get(entryFile) as string, remappings, [], fao, sync)
	return { effect, reads }
}

const snapshot = (modules: Map<string, ModuleInfo>) => [...modules.entries()]

describe('resolutions import graph fuzz', { timeout: 60_000 }, () => {
	it(`terminates and resolves exactly the reachable module set for DAG, diamond, self importing and cyclic graphs (${RUNS} runs)`, async () => {
		await forAll(
			'module graph model equivalence',
			(rng) => genGraph(rng),
			(graph) => {
				const rendered = renderGraph(graph)
				const { effect, reads } = run(graph, rendered, true)
				const modules = runSync(effect)
				const entryFile = graph.files[graph.entry] as string
				const expected = reachable(entryFile, rendered.imports)

				// exactly the reachable set, each module once
				expect([...modules.keys()].sort()).toEqual([...expected].sort())
				expect([...modules.keys()][0]).toBe(entryFile)

				let importStatements = 0
				for (const [id, module] of modules) {
					const targets = rendered.imports.get(id) as string[]
					importStatements += targets.length
					expect(module.id).toBe(id)
					expect(module.rawCode).toBe(rendered.sources.get(id))
					expect(module.importedIds).toEqual(targets)
					for (const importedId of module.importedIds) {
						expect(modules.has(importedId)).toBe(true)
						expect(posix.isAbsolute(importedId)).toBe(true)
						expect(importedId).toBe(posix.normalize(importedId))
					}
				}
				// termination bound: every reachable module is processed once, so the number of
				// file reads equals the number of import statements in reachable modules
				expect(reads).toHaveLength(importStatements)
				expect(reads.every((file) => expected.has(file))).toBe(true)
			},
			shrinkGraph,
		)
	})

	it(`rewrites every import to its absolute path so the output resolves without remappings (${RUNS} runs)`, async () => {
		await forAll(
			'rewritten code fixed point',
			(rng) => genGraph(rng),
			(graph) => {
				const rendered = renderGraph(graph)
				const modules = runSync(run(graph, rendered, true).effect)
				for (const [id, module] of modules) {
					const code = module.code as string
					const targets = rendered.imports.get(id) as string[]
					// every rewritten specifier is an absolute path below the root: an identity remapping
					// of the root resolves it without the original remappings or the original location
					const identity = { [`${ROOT}/`]: `${ROOT}/` }
					const rewritten = runSync(resolveImports('/elsewhere/Other.sol', code, identity, [], true))
					expect(rewritten.map(({ absolute }) => absolute)).toEqual(targets)
					expect(rewritten.map(({ original }) => original)).toEqual(targets)
					// rewriting is idempotent
					expect(runSync(updateImportPaths(code, rewritten))).toBe(code)
					// only import specifiers change: same line structure and same non import text
					const rawLines = (module.rawCode as string).split('\n')
					const codeLines = code.split('\n')
					expect(codeLines).toHaveLength(rawLines.length)
					const specifiers = new Set(rendered.specifiers.get(id))
					rawLines.forEach((line, index) => {
						const touched =
							[...specifiers].some((specifier) => line.includes(specifier)) && /\bimport\b|from/.test(line)
						if (!touched) expect(codeLines[index]).toBe(line)
					})
					if (graph.ghosts[graph.files.indexOf(id)]) {
						expect(code).toContain('// import "./Ghost.sol";')
						expect(code).toContain('/* import "./Ghost.sol"; */')
						expect(code).toContain('import { Ghost } from "@lib/Ghost.sol";')
					}
				}
			},
			shrinkGraph,
		)
	})

	it(`is deterministic and sync resolution equals async resolution (${RUNS} runs)`, async () => {
		await forAll(
			'sync async equivalence',
			(rng) => genGraph(rng),
			async (graph) => {
				const rendered = renderGraph(graph)
				const first = run(graph, rendered, true)
				const sync = snapshot(runSync(first.effect))
				const second = run(graph, rendered, true)
				expect(snapshot(runSync(second.effect))).toEqual(sync)
				const third = run(graph, rendered, false)
				expect(snapshot(await runPromise(third.effect))).toEqual(sync)
				expect(second.reads).toEqual(first.reads)
				expect(third.reads).toEqual(first.reads)
			},
			shrinkGraph,
		)
	})

	it(`is invariant under remapping declaration order and unused remappings (${RUNS} runs)`, async () => {
		await forAll(
			'remapping order invariance',
			(rng) => {
				const graph = genGraph(rng)
				return { graph, shuffled: rng.shuffle(graph.remappings) }
			},
			({ graph, shuffled }) => {
				const rendered = renderGraph(graph)
				const baseline = snapshot(runSync(run(graph, rendered, true).effect))
				expect(snapshot(runSync(run(graph, rendered, true, toRecord(shuffled)).effect))).toEqual(baseline)
				const withUnused = { ...toRecord(shuffled), 'never-imported/': '/nowhere/', '@unused/x/': '/nowhere/x/' }
				expect(snapshot(runSync(run(graph, rendered, true, withUnused).effect))).toEqual(baseline)
			},
			function* ({ graph, shuffled }) {
				for (const smaller of shrinkGraph(graph)) {
					yield { graph: smaller, shuffled: shuffled.filter((r) => smaller.remappings.includes(r)) }
				}
			},
		)
	})

	it(`resolving from a dependency yields a consistent sub graph of the entry graph (${RUNS} runs)`, async () => {
		await forAll(
			'sub graph consistency',
			(rng) => ({ graph: genGraph(rng), pick: rng.next() }),
			({ graph, pick }) => {
				const rendered = renderGraph(graph)
				const modules = runSync(run(graph, rendered, true).effect)
				const ids = [...modules.keys()]
				const dependency = ids[Math.floor(pick * ids.length)] as string
				const sub = runSync(
					run(graph, rendered, true, toRecord(graph.remappings), graph.files.indexOf(dependency)).effect,
				)
				expect([...sub.keys()].sort()).toEqual([...reachable(dependency, rendered.imports)].sort())
				for (const [id, module] of sub) {
					// a module resolves identically no matter which entry point reached it
					expect(module).toEqual(modules.get(id))
				}
			},
			function* ({ graph, pick }) {
				for (const smaller of shrinkGraph(graph)) yield { graph: smaller, pick }
			},
		)
	})

	it(`fails with a typed error and still terminates when an imported file is missing (${RUNS} runs)`, async () => {
		await forAll(
			'missing file',
			(rng) => ({ graph: genGraph(rng), pick: rng.next(), sync: rng.bool() }),
			async ({ graph, pick, sync }) => {
				const rendered = renderGraph(graph)
				const entryFile = graph.files[graph.entry] as string
				const dependencies = [...reachable(entryFile, rendered.imports)].filter((file) => file !== entryFile)
				if (dependencies.length === 0) return
				const missing = dependencies[Math.floor(pick * dependencies.length)] as string
				rendered.sources.delete(missing)
				const { effect } = run(graph, rendered, sync)
				const result = sync ? runSync(either(effect)) : await runPromise(either(effect))
				expect(result._tag).toBe('Left')
				expect(result._tag === 'Left' && result.left._tag).toBe('ReadFileError')
			},
			function* ({ graph, pick, sync }) {
				for (const smaller of shrinkGraph(graph)) yield { graph: smaller, pick, sync }
			},
		)
	})
})

describe('resolveImportPath fuzz', { timeout: 60_000 }, () => {
	const genRemappings = (rng: Rng): Remapping[] => {
		const remappings: Remapping[] = []
		let prefix = rng.pick(['@lib/', 'forge-std/', '@scope/pkg/', 'ünï/', 'x'])
		const depth = rng.int(1, 5)
		for (let i = 0; i < depth; i++) {
			remappings.push({ prefix, dir: `${genDir(rng)}${rng.bool(0.7) ? '/' : ''}` })
			prefix += rng.pick(['sub/', 'a/b/', 'x', '日本/'])
		}
		return remappings
	}

	it(`applies the longest matching prefix and treats targets literally (${RUNS * 2} runs)`, async () => {
		await forAll(
			'longest prefix remapping',
			(rng) => {
				const remappings = genRemappings(rng)
				const rest = Array.from({ length: rng.int(1, 3) }, () => rng.pick([...SEGMENTS, '..', '.'])).join('/')
				return {
					remappings,
					shuffled: rng.shuffle(remappings),
					specifier: `${rng.pick(remappings).prefix}${rest}.sol`,
					sync: rng.bool(),
				}
			},
			async ({ remappings, shuffled, specifier, sync }) => {
				const expected = expectedRemap(specifier, remappings)
				const resolve = (record: Record<string, string>) => {
					const effect = resolveImportPath('/project/src/Entry.sol', specifier, record, [], sync)
					return sync ? runSync(effect) : runPromise(effect)
				}
				const resolved = await resolve(toRecord(remappings))
				expect(resolved).toBe(expected)
				expect(await resolve(toRecord(shuffled))).toBe(expected)
				expect(await resolve(toRecord(remappings))).toBe(resolved)
				expect(posix.isAbsolute(resolved)).toBe(true)
				expect(resolved).not.toContain('\\')
			},
			function* (value) {
				for (let i = 0; i < value.remappings.length; i++) {
					const remappings = [...value.remappings.slice(0, i), ...value.remappings.slice(i + 1)]
					yield { ...value, remappings, shuffled: remappings }
				}
			},
			RUNS * 2,
		)
	})

	it(`resolves relative imports against the importing file and ignores unrelated remappings (${RUNS * 2} runs)`, async () => {
		await forAll(
			'relative imports',
			(rng) => ({
				from: `${genDir(rng)}/Entry.sol`,
				specifier: `${rng.pick(['./', '../', '../../', './././', '.././'])}${Array.from({ length: rng.int(1, 3) }, () => rng.pick([...SEGMENTS, '..', '.'])).join('/')}.sol`,
				remappings: genRemappings(rng),
				sync: rng.bool(),
			}),
			async ({ from, specifier, remappings, sync }) => {
				const effect = resolveImportPath(from, specifier, toRecord(remappings), [], sync)
				const resolved = sync ? runSync(effect) : await runPromise(effect)
				expect(resolved).toBe(posix.resolve(posix.dirname(from), specifier))
				// resolving the result again from anywhere is not a relative import anymore
				expect(posix.isAbsolute(resolved)).toBe(true)
			},
			undefined,
			RUNS * 2,
		)
	})

	it(`fails with CouldNotResolveImportError for bare imports that match no remapping or library (${RUNS} runs)`, async () => {
		await forAll(
			'unresolvable imports',
			(rng) => ({
				specifier: `tevm-fuzz-missing-${rng.int(0, 1e9)}/${rng.pick(SEGMENTS)}/Missing.sol`,
				libs: Array.from({ length: rng.int(0, 2) }, () => genDir(rng)),
				sync: rng.bool(),
			}),
			async ({ specifier, libs, sync }) => {
				const effect = either(resolveImportPath(`${ROOT}/src/Entry.sol`, specifier, { '@lib/': '/x/' }, libs, sync))
				const result = sync ? runSync(effect) : await runPromise(effect)
				expect(result._tag).toBe('Left')
				expect(result._tag === 'Left' && result.left._tag).toBe('CouldNotResolveImportError')
			},
		)
	})
})

describe('resolveImports robustness fuzz', { timeout: 60_000 }, () => {
	const TOKENS = [
		'import',
		'import ',
		' import',
		'imports',
		'from',
		'"',
		"'",
		'""',
		"''",
		'./A.sol',
		'../B.sol',
		'@lib/C.sol',
		';',
		'\n',
		'\r\n',
		'\t',
		' ',
		'/*',
		'*/',
		'//',
		'/*/',
		'{',
		'}',
		'*',
		' as ',
		'pragma solidity ^0.8.0;',
		'日本',
		'\0',
		' ',
		'$&',
		'\\',
	]

	it(`never crashes, terminates and resolves deterministically on arbitrary source text (${RUNS * 3} runs)`, async () => {
		await forAll(
			'arbitrary source text',
			(rng) => Array.from({ length: rng.int(0, 24) }, () => rng.pick(TOKENS)),
			(tokens) => {
				const code = tokens.join('')
				const remappings = { '@lib/': `${ROOT}/lib/` }
				const resolve = () => runSync(either(resolveImports(`${ROOT}/src/Entry.sol`, code, remappings, [], true)))
				const result = resolve()
				expect(resolve()).toEqual(result)
				if (result._tag === 'Left') {
					expect(['ImportDoesNotExistError', 'CouldNotResolveImportError']).toContain(result.left._tag)
					return
				}
				for (const { original, absolute, updated } of result.right) {
					expect(original.length).toBeGreaterThan(0)
					expect(code).toContain(original)
					expect(updated).toBe(absolute)
					expect(posix.isAbsolute(absolute)).toBe(true)
				}
				// rewriting never throws and never changes the number of lines
				const rewritten = runSync(updateImportPaths(code, result.right))
				expect(rewritten.split('\n')).toHaveLength(code.split('\n').length)
				expect(runSync(updateImportPaths(code, []))).toBe(code)
			},
			function* (tokens) {
				for (let i = 0; i < tokens.length; i++) yield [...tokens.slice(0, i), ...tokens.slice(i + 1)]
			},
			RUNS * 3,
		)
	})
})

describe('regressions found by fuzzing', () => {
	it('does not interpret `$` replacement patterns in remapping targets', () => {
		const resolve = (target: string) =>
			runSync(resolveImportPath('/project/src/Entry.sol', '@lib/Token.sol', { '@lib/': target }, [], true))
		expect(resolve('/deps/$&/')).toBe('/deps/$&/Token.sol')
		expect(resolve("/deps/$'/")).toBe("/deps/$'/Token.sol")
		expect(resolve('/deps/$`/')).toBe('/deps/$`/Token.sol')
		expect(resolve('/deps/$$/')).toBe('/deps/$$/Token.sol')
		expect(resolve('/deps/$1/')).toBe('/deps/$1/Token.sol')
	})

	it('rewrites an import that follows a block comment on the same line', () => {
		const code = 'pragma solidity ^0.8.20;\n/* license */ import "./A.sol";\n/* import "./A.sol"; */'
		const resolved = runSync(resolveImports('/project/src/Entry.sol', code, {}, [], true))
		expect(resolved.map(({ absolute }) => absolute)).toEqual(['/project/src/A.sol'])
		expect(runSync(updateImportPaths(code, resolved))).toBe(
			'pragma solidity ^0.8.20;\n/* license */ import "/project/src/A.sol";\n/* import "./A.sol"; */',
		)
	})

	it('reads an import path up to the matching quote', () => {
		const code = ['pragma solidity ^0.8.20;', `import "./it's/A.sol";`, `import { B } from './say "hi"/B.sol';`].join(
			'\n',
		)
		const resolved = runSync(resolveImports('/project/src/Entry.sol', code, {}, [], true))
		expect(resolved.map(({ original }) => original)).toEqual(["./it's/A.sol", './say "hi"/B.sol'])
		expect(resolved.map(({ absolute }) => absolute)).toEqual(["/project/src/it's/A.sol", '/project/src/say "hi"/B.sol'])
		expect(runSync(updateImportPaths(code, resolved))).toBe(
			[
				'pragma solidity ^0.8.20;',
				`import "/project/src/it's/A.sol";`,
				`import { B } from '/project/src/say "hi"/B.sol';`,
			].join('\n'),
		)
	})
})
