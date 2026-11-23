/**
 * Property and metamorphic fuzz tests for the runtime code generators
 * (`generateRuntime`, `generateTevmBody`, `generateDtsBody`).
 *
 * Every generated module is parsed with the real TypeScript compiler API and must have
 * zero syntax diagnostics. JavaScript and TypeScript outputs are also executed against a
 * stub `createContract` to prove that the generated values round trip.
 *
 * Self-contained: uses a seeded PRNG and a greedy shrinker instead of an external
 * property testing dependency. Override with FUZZ_SEED and FUZZ_RUNS.
 */
import { formatAbi } from 'abitype'
import { runSync } from 'effect/Effect'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { generateRuntime } from './generateRuntime.js'
import { generateTevmBody } from './generateTevmBody.js'
import { generateDtsBody } from './generateTevmBodyDts.js'
import type { ModuleType } from './types.js'

// ---------------------------------------------------------------------------
// seeded property testing helpers
// ---------------------------------------------------------------------------

const SEED = Number(process.env['FUZZ_SEED'] ?? 0x7e5d2026) >>> 0
const RUNS = Math.max(1, Number(process.env['FUZZ_RUNS'] ?? 200))

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

const failure = <T>(property: (value: T) => void, value: T): Error | undefined => {
	try {
		property(value)
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
		while (progress && steps < 500) {
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

// ---------------------------------------------------------------------------
// artifact generators
// ---------------------------------------------------------------------------

type AbiParameter = {
	type: string
	name: string
	internalType?: string
	indexed?: boolean
	components?: AbiParameter[]
}
type AbiItem = {
	type: 'function' | 'event' | 'error' | 'constructor' | 'fallback' | 'receive'
	name?: string
	inputs?: AbiParameter[]
	outputs?: AbiParameter[]
	stateMutability?: string
	anonymous?: boolean
}
type Artifact = {
	abi: AbiItem[]
	userdoc?: { kind?: string; version?: number; notice?: string; methods?: Record<string, { notice?: string }> }
	evm?: Record<string, unknown>
	contractName?: string
}
type Artifacts = Record<string, Artifact>

const IDENT_START = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
const IDENT_PART = `${IDENT_START}0123456789`

/** ECMAScript reserved words and contextual names. Many are legal Solidity contract names. */
const HOSTILE_NAMES = [
	'arguments',
	'as',
	'async',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'eval',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'from',
	'function',
	'get',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'of',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'set',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'type',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'createContract',
	'Contract',
	'declare',
	'namespace',
	'readonly',
	'unique',
	'Object',
	'JSON',
	'Symbol',
	'Promise',
	'constructor',
	'prototype',
	'toString',
	'hasOwnProperty',
	'$',
	'_',
	'$$',
	'__',
	'_0',
	'$0',
]

/**
 * Names the generators avoid. Each is a documented limitation rather than fuzz noise:
 * - `artifacts` collides with the `artifacts` export every generated module has
 * - `__proto__` is not an own key in the JSON object literal the module embeds
 * - `module`, `exports` and `require` collide with the CommonJS harness used to execute modules
 */
const UNSUPPORTED_NAMES = new Set(['artifacts', '__proto__', 'module', 'exports', 'require'])

const genIdentifier = (rng: Rng, hostile = 0.25) => {
	if (rng.bool(hostile)) return rng.pick(HOSTILE_NAMES)
	let identifier = IDENT_START[rng.int(0, IDENT_START.length - 1)] as string
	const length = rng.int(0, 10)
	for (let i = 0; i < length; i++) {
		identifier += IDENT_PART[rng.int(0, IDENT_PART.length - 1)]
	}
	return identifier
}

/** Generated modules derive internal bindings from the contract name by prefixing */
const INTERNAL_PREFIXES = ['_', '_name', '_abi', '_tevm_']
const collides = (name: string, names: ReadonlyArray<string>) =>
	UNSUPPORTED_NAMES.has(name) ||
	names.some(
		(other) =>
			other === name ||
			INTERNAL_PREFIXES.some((prefix) => `${prefix}${other}` === name || `${prefix}${name}` === other),
	)

const genElementaryType = (rng: Rng) => {
	const kind = rng.int(0, 7)
	if (kind === 0) return `uint${rng.int(1, 32) * 8}`
	if (kind === 1) return `int${rng.int(1, 32) * 8}`
	if (kind === 2) return 'address'
	if (kind === 3) return 'bool'
	if (kind === 4) return `bytes${rng.int(1, 32)}`
	if (kind === 5) return 'bytes'
	if (kind === 6) return 'string'
	return 'uint256'
}

const genArraySuffix = (rng: Rng) => {
	let suffix = ''
	while (rng.bool(0.25) && suffix.length < 12) {
		suffix += rng.bool() ? '[]' : `[${rng.int(1, 9)}]`
	}
	return suffix
}

const genParameter = (rng: Rng, contractName: string, depth: number, allowIndexed: boolean): AbiParameter => {
	const name = rng.bool(0.15) ? '' : genIdentifier(rng, 0.1)
	const suffix = genArraySuffix(rng)
	const indexed = allowIndexed && rng.bool(0.3) ? { indexed: true } : allowIndexed ? { indexed: false } : {}
	const kind = rng.int(0, 9)
	if (kind === 0 && depth < 3) {
		// struct
		const structName = genIdentifier(rng, 0)
		return {
			type: `tuple${suffix}`,
			name,
			internalType: `struct ${contractName}.${structName}${suffix}`,
			components: Array.from({ length: rng.int(1, 4) }, () => genParameter(rng, contractName, depth + 1, false)),
			...indexed,
		}
	}
	if (kind === 1) {
		// enum
		return {
			type: `uint8${suffix}`,
			name,
			internalType: `enum ${contractName}.${genIdentifier(rng, 0)}${suffix}`,
			...indexed,
		}
	}
	if (kind === 2) {
		// contract or user defined value type
		return { type: `address${suffix}`, name, internalType: `contract ${genIdentifier(rng, 0)}${suffix}`, ...indexed }
	}
	const type = `${genElementaryType(rng)}${suffix}`
	return { type, name, ...(rng.bool(0.7) ? { internalType: type } : {}), ...indexed }
}

const genParameters = (rng: Rng, contractName: string, max: number, allowIndexed = false) =>
	Array.from({ length: rng.int(0, max) }, () => genParameter(rng, contractName, 0, allowIndexed))

const genAbi = (rng: Rng, contractName: string): AbiItem[] => {
	const abi: AbiItem[] = []
	const functionNames = Array.from({ length: rng.int(1, 4) }, () => genIdentifier(rng, 0.2))
	const count = rng.int(0, 6)
	for (let i = 0; i < count; i++) {
		const kind = rng.int(0, 9)
		if (kind <= 4) {
			// reusing names produces overloads
			abi.push({
				type: 'function',
				name: rng.pick(functionNames),
				inputs: genParameters(rng, contractName, 4),
				outputs: genParameters(rng, contractName, 3),
				stateMutability: rng.pick(['pure', 'view', 'nonpayable', 'payable']),
			})
		} else if (kind <= 6) {
			abi.push({
				type: 'event',
				name: genIdentifier(rng, 0.2),
				inputs: genParameters(rng, contractName, 4, true),
				anonymous: rng.bool(0.2),
			})
		} else if (kind === 7) {
			abi.push({ type: 'error', name: genIdentifier(rng, 0.2), inputs: genParameters(rng, contractName, 3) })
		} else if (kind === 8) {
			abi.push({
				type: 'constructor',
				inputs: genParameters(rng, contractName, 3),
				stateMutability: rng.pick(['nonpayable', 'payable']),
			})
		} else {
			abi.push(
				rng.bool()
					? { type: 'fallback', stateMutability: rng.pick(['nonpayable', 'payable']) }
					: { type: 'receive', stateMutability: 'payable' },
			)
		}
	}
	return abi
}

const HEX = '0123456789abcdef'
const genHex = (rng: Rng) => {
	let hex = ''
	const bytes = rng.int(1, 48)
	for (let i = 0; i < bytes * 2; i++) hex += HEX[rng.int(0, 15)]
	// unlinked library placeholder
	if (rng.bool(0.1)) hex += `__$${hex.padEnd(34, '0').slice(0, 34)}$__${hex}`
	return hex
}

const INJECTION = '*/ globalThis.__tevmFuzzPwned = true; /*'
const NOTICE_PARTS = [
	'*/',
	'/*',
	'*',
	'/',
	'\n',
	'\r\n',
	'\r',
	'`',
	// biome-ignore lint/suspicious/noTemplateCurlyInString: hostile natspec text
	'${globalThis.__tevmFuzzPwned = true}',
	INJECTION,
	'*\\/',
	'\\',
	'"',
	"'",
	'@property',
	'@see {@link x}',
	'</script>',
	' ',
	' ',
	'日本語',
	'🚀',
	'\t',
	'//',
	'Transfers tokens',
	' ',
]

const genNotice = (rng: Rng) => Array.from({ length: rng.int(0, 6) }, () => rng.pick(NOTICE_PARTS)).join('')

const genBytecode = (rng: Rng) => {
	const kind = rng.int(0, 5)
	if (kind === 0) return undefined
	if (kind === 1) return { object: '' }
	return {
		object: genHex(rng),
		...(rng.bool() ? { opcodes: 'PUSH1 0x80 PUSH1 0x40 MSTORE', sourceMap: '0:1:0:-:0;;;;;', linkReferences: {} } : {}),
	}
}

const genArtifact = (rng: Rng, contractName: string): Artifact => {
	const abi = genAbi(rng, contractName)
	const artifact: Artifact = { abi }
	if (rng.bool(0.7)) {
		const methods: Record<string, { notice?: string }> = {}
		for (const item of abi) {
			if (item.type === 'function' && rng.bool(0.6)) {
				const signature = `${item.name}(${(item.inputs ?? []).map(({ type }) => type).join(',')})`
				methods[rng.bool(0.1) ? `${signature}${genNotice(rng)}` : signature] = rng.bool(0.9)
					? { notice: genNotice(rng) }
					: {}
			}
		}
		artifact.userdoc = {
			kind: 'user',
			version: 1,
			...(rng.bool(0.7) ? { notice: genNotice(rng) } : {}),
			...(rng.bool(0.9) ? { methods } : {}),
		}
	}
	if (rng.bool(0.85)) {
		const bytecode = genBytecode(rng)
		const deployedBytecode = genBytecode(rng)
		artifact.evm = {
			...(bytecode ? { bytecode } : {}),
			...(deployedBytecode ? { deployedBytecode } : {}),
			...(rng.bool(0.3) ? { methodIdentifiers: { 'f()': '26121ff0' }, gasEstimates: null } : {}),
		}
	}
	if (rng.bool(0.3)) artifact.contractName = contractName
	return artifact
}

const genArtifacts = (rng: Rng): Artifacts => {
	const names: string[] = []
	const count = rng.int(1, 3)
	while (names.length < count) {
		const name = genIdentifier(rng)
		if (!collides(name, names)) names.push(name)
	}
	return Object.fromEntries(names.map((name) => [name, genArtifact(rng, name)]))
}

function* shrinkArtifacts(artifacts: Artifacts): Iterable<Artifacts> {
	const names = Object.keys(artifacts)
	if (names.length > 1) {
		for (const removed of names) {
			yield Object.fromEntries(Object.entries(artifacts).filter(([name]) => name !== removed))
		}
	}
	for (const name of names) {
		const artifact = artifacts[name] as Artifact
		for (let i = 0; i < artifact.abi.length; i++) {
			yield { ...artifacts, [name]: { ...artifact, abi: [...artifact.abi.slice(0, i), ...artifact.abi.slice(i + 1)] } }
		}
		if (artifact.userdoc) {
			const { userdoc: _userdoc, ...rest } = artifact
			yield { ...artifacts, [name]: rest }
		}
		if (artifact.evm) {
			const { evm: _evm, ...rest } = artifact
			yield { ...artifacts, [name]: rest }
		}
	}
}

// ---------------------------------------------------------------------------
// system under test helpers
// ---------------------------------------------------------------------------

const MODULE_TYPES: ReadonlyArray<ModuleType> = ['ts', 'dts', 'mjs', 'cjs']
const PACKAGES = ['tevm/contract', '@tevm/contract'] as const
const FILE_NAMES: Record<ModuleType, string> = {
	ts: 'Contract.sol.ts',
	dts: 'Contract.sol.d.ts',
	mjs: 'Contract.sol.mjs',
	cjs: 'Contract.sol.cjs',
}
const SCRIPT_KINDS: Record<ModuleType, ts.ScriptKind> = {
	ts: ts.ScriptKind.TS,
	dts: ts.ScriptKind.TS,
	mjs: ts.ScriptKind.JS,
	cjs: ts.ScriptKind.JS,
}

const generate = (
	artifacts: Artifacts,
	moduleType: ModuleType,
	includeBytecode: boolean,
	tevmPackage: (typeof PACKAGES)[number] = '@tevm/contract',
) => runSync(generateRuntime(artifacts as never, moduleType, includeBytecode, tevmPackage))

const parse = (code: string, moduleType: ModuleType) => {
	const sourceFile = ts.createSourceFile(
		FILE_NAMES[moduleType],
		code,
		ts.ScriptTarget.ESNext,
		true,
		SCRIPT_KINDS[moduleType],
	)
	const diagnostics = (sourceFile as unknown as { parseDiagnostics: ts.DiagnosticWithLocation[] }).parseDiagnostics
	return { sourceFile, diagnostics }
}

const expectNoSyntaxErrors = (code: string, moduleType: ModuleType) => {
	const { sourceFile, diagnostics } = parse(code, moduleType)
	if (diagnostics.length > 0) {
		const [first] = diagnostics as [ts.DiagnosticWithLocation]
		const { line } = sourceFile.getLineAndCharacterOfPosition(first.start)
		throw new Error(
			`${moduleType} output has ${diagnostics.length} syntax diagnostics. First: ${ts.flattenDiagnosticMessageText(first.messageText, '\n')} at line ${line + 1}: ${code.split('\n')[line]}`,
		)
	}
	return sourceFile
}

/** Collects the names a module exports with `export const x` or `export { y as x }` */
const exportedNames = (sourceFile: ts.SourceFile) => {
	const names: string[] = []
	for (const statement of sourceFile.statements) {
		if (
			ts.isVariableStatement(statement) &&
			statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
		) {
			for (const declaration of statement.declarationList.declarations) {
				names.push(declaration.name.getText(sourceFile))
			}
		}
		if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
			for (const element of statement.exportClause.elements) {
				names.push(element.name.text)
			}
		}
	}
	return names
}

/** Executes a generated module with a stub createContract and returns its exports */
const evaluate = (code: string, moduleType: Exclude<ModuleType, 'dts'>, tevmPackage: string) => {
	let commonJs = code
	if (moduleType !== 'cjs') {
		const transpiled = ts.transpileModule(code, {
			// a neutral extension: `.mjs` would keep ES module syntax
			fileName: moduleType === 'ts' ? 'Contract.sol.ts' : 'Contract.sol.js',
			reportDiagnostics: true,
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		})
		expect((transpiled.diagnostics ?? []).map(({ messageText }) => messageText)).toEqual([])
		commonJs = transpiled.outputText
	}
	const module = { exports: {} as Record<string, unknown> }
	const required: string[] = []
	const require = (id: string) => {
		required.push(id)
		return { createContract: (params: unknown) => ({ created: true, params }) }
	}
	// V8 rejects duplicate declarations and strict mode violations that a parser tolerates
	new Function('require', 'module', 'exports', commonJs)(require, module, module.exports)
	expect(required).toEqual([tevmPackage])
	return module.exports
}

const jsonClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const expectedContract = (name: string, artifact: Artifact, includeBytecode: boolean) => {
	const bytecode = (artifact.evm?.['bytecode'] as { object?: string } | undefined)?.object
	const deployedBytecode = (artifact.evm?.['deployedBytecode'] as { object?: string } | undefined)?.object
	return {
		created: true,
		params: {
			name,
			humanReadableAbi: [...formatAbi(artifact.abi as never)],
			...(includeBytecode && bytecode ? { bytecode: `0x${bytecode}` } : {}),
			...(includeBytecode && deployedBytecode ? { deployedBytecode: `0x${deployedBytecode}` } : {}),
		},
	}
}

type CodegenCase = { artifacts: Artifacts; includeBytecode: boolean; tevmPackage: (typeof PACKAGES)[number] }

const genCase = (rng: Rng): CodegenCase => ({
	artifacts: genArtifacts(rng),
	includeBytecode: rng.bool(),
	tevmPackage: rng.pick(PACKAGES),
})

function* shrinkCase(value: CodegenCase): Iterable<CodegenCase> {
	for (const artifacts of shrinkArtifacts(value.artifacts)) yield { ...value, artifacts }
}

describe('runtime codegen fuzz', { timeout: 60_000 }, () => {
	it(`emits zero syntax diagnostics for every module type and bytecode mode (${RUNS} runs x 8 outputs)`, () => {
		forAll(
			'codegen syntax',
			(rng) => ({ artifacts: genArtifacts(rng), tevmPackage: rng.pick(PACKAGES) }),
			({ artifacts, tevmPackage }) => {
				for (const moduleType of MODULE_TYPES) {
					for (const includeBytecode of [true, false]) {
						const code = generate(artifacts, moduleType, includeBytecode, tevmPackage)
						expectNoSyntaxErrors(code, moduleType)
						// deterministic
						expect(generate(artifacts, moduleType, includeBytecode, tevmPackage)).toBe(code)
					}
				}
			},
			function* (value) {
				for (const artifacts of shrinkArtifacts(value.artifacts)) yield { ...value, artifacts }
			},
		)
	})

	it(`exports exactly the contract names plus artifacts from ts, mjs and dts modules (${RUNS} runs)`, () => {
		forAll(
			'codegen export names',
			genCase,
			({ artifacts, includeBytecode, tevmPackage }) => {
				const expected = [...Object.keys(artifacts), 'artifacts'].sort()
				for (const moduleType of ['ts', 'mjs', 'dts'] as const) {
					const sourceFile = expectNoSyntaxErrors(
						generate(artifacts, moduleType, includeBytecode, tevmPackage),
						moduleType,
					)
					expect(exportedNames(sourceFile).sort()).toEqual(expected)
				}
			},
			shrinkCase,
		)
	})

	it(`executes ts, mjs and cjs modules to identical contracts and artifacts (${RUNS} runs)`, () => {
		forAll(
			'codegen execution round trip',
			genCase,
			({ artifacts, includeBytecode, tevmPackage }) => {
				const expected: Record<string, unknown> = { artifacts: jsonClone(artifacts) }
				for (const [name, artifact] of Object.entries(artifacts)) {
					expected[name] = expectedContract(name, artifact, includeBytecode)
				}
				for (const moduleType of ['cjs', 'mjs', 'ts'] as const) {
					const code = generate(artifacts, moduleType, includeBytecode, tevmPackage)
					const exports = evaluate(code, moduleType, tevmPackage)
					expect(Object.keys(exports).sort()).toEqual(Object.keys(expected).sort())
					for (const name of Object.keys(expected)) {
						expect(exports[name]).toEqual(expected[name])
					}
					if (!includeBytecode) {
						for (const name of Object.keys(artifacts)) {
							const { params } = exports[name] as { params: Record<string, unknown> }
							expect(params).not.toHaveProperty('bytecode')
							expect(params).not.toHaveProperty('deployedBytecode')
						}
					}
				}
				// hostile natspec must stay inside comments
				expect((globalThis as Record<string, unknown>)['__tevmFuzzPwned']).toBeUndefined()
			},
			shrinkCase,
		)
	})

	it(`declares dts types that mirror the artifacts and bytecode presence (${RUNS} runs)`, () => {
		forAll(
			'codegen dts structure',
			genCase,
			({ artifacts, includeBytecode, tevmPackage }) => {
				const code = generate(artifacts, 'dts', includeBytecode, tevmPackage)
				const sourceFile = expectNoSyntaxErrors(code, 'dts')
				const declarations = new Map<string, ts.VariableDeclaration>()
				const aliases = new Map<string, string>()
				for (const statement of sourceFile.statements) {
					if (ts.isVariableStatement(statement)) {
						for (const declaration of statement.declarationList.declarations) {
							declarations.set(declaration.name.getText(sourceFile), declaration)
						}
					}
					if (
						ts.isExportDeclaration(statement) &&
						statement.exportClause &&
						ts.isNamedExports(statement.exportClause)
					) {
						for (const element of statement.exportClause.elements) {
							aliases.set(element.name.text, (element.propertyName ?? element.name).text)
						}
					}
				}
				// the artifacts type literal is the artifacts JSON
				const artifactsType = declarations.get('artifacts')?.type?.getText(sourceFile)
				expect(JSON.parse(artifactsType ?? 'null')).toEqual(jsonClone(artifacts))

				for (const [name, artifact] of Object.entries(artifacts)) {
					const nameType = declarations.get(`_name${name}`)?.type?.getText(sourceFile)
					expect(JSON.parse(nameType ?? 'null')).toBe(name)
					const abiType = declarations.get(`_abi${name}`)?.type
					expect(abiType && ts.isTypeOperatorNode(abiType)).toBe(true)
					const abiTuple = (abiType as ts.TypeOperatorNode).type.getText(sourceFile)
					expect(JSON.parse(abiTuple)).toEqual([...formatAbi(artifact.abi as never)])

					const contractType = declarations.get(aliases.get(name) ?? name)?.type
					expect(contractType && ts.isTypeReferenceNode(contractType)).toBe(true)
					const typeArguments = ((contractType as ts.TypeReferenceNode).typeArguments ?? []).map((node) =>
						node.getText(sourceFile),
					)
					const bytecode = (artifact.evm?.['bytecode'] as { object?: string } | undefined)?.object
					const deployedBytecode = (artifact.evm?.['deployedBytecode'] as { object?: string } | undefined)?.object
					// biome-ignore lint/suspicious/noTemplateCurlyInString: generated template literal type
					const hexType = '`0x${string}`'
					expect(typeArguments).toEqual([
						`typeof _name${name}`,
						`typeof _abi${name}`,
						'undefined',
						includeBytecode && bytecode ? hexType : 'undefined',
						includeBytecode && deployedBytecode ? hexType : 'undefined',
						'undefined',
					])
				}
			},
			shrinkCase,
		)
	})

	it(`generateRuntime is the import line plus generateTevmBody, and dts delegates to generateDtsBody (${RUNS} runs)`, () => {
		forAll(
			'codegen composition',
			genCase,
			({ artifacts, includeBytecode, tevmPackage }) => {
				for (const moduleType of MODULE_TYPES) {
					const code = generate(artifacts, moduleType, includeBytecode, tevmPackage)
					const body = runSync(generateTevmBody(artifacts as never, moduleType, includeBytecode))
					const [importLine, ...rest] = code.split('\n')
					expect(rest.join('\n')).toBe(body)
					expect(importLine).toContain(`'${tevmPackage}'`)
					expect(importLine?.includes('require(')).toBe(moduleType === 'cjs')
					if (moduleType === 'dts') {
						expect(body).toBe(runSync(generateDtsBody(artifacts as never, includeBytecode)))
						expect(importLine).toBe(`import type { Contract } from '${tevmPackage}'`)
					}
				}
			},
			shrinkCase,
		)
	})

	const ORDER_RUNS = Math.ceil(RUNS / 2)
	it(`contract order does not change what each contract exports (${ORDER_RUNS} runs)`, () => {
		forAll(
			'codegen contract order invariance',
			(rng) => {
				const artifacts = genArtifacts(rng)
				return {
					artifacts,
					shuffled: Object.fromEntries(rng.shuffle(Object.entries(artifacts))) as Artifacts,
					includeBytecode: rng.bool(),
					moduleType: rng.pick(['cjs', 'cjs', 'mjs', 'ts'] as const),
				}
			},
			({ artifacts, shuffled, includeBytecode, moduleType }) => {
				const original = evaluate(generate(artifacts, moduleType, includeBytecode), moduleType, '@tevm/contract')
				const reordered = evaluate(generate(shuffled, moduleType, includeBytecode), moduleType, '@tevm/contract')
				expect(reordered).toEqual(original)
			},
			undefined,
			ORDER_RUNS,
		)
	})

	it('dies on empty artifacts and unknown module types', () => {
		for (const moduleType of MODULE_TYPES) {
			expect(() => generate({}, moduleType, true)).toThrow('No artifacts provided to generateRuntime')
		}
		for (const moduleType of ['', 'esm', 'js', 'TS', '__proto__x', 'd.ts']) {
			expect(() => generate({ A: { abi: [] } }, moduleType as ModuleType, true)).toThrow('Unknown module type')
		}
	})

	describe('regressions found by fuzzing', () => {
		const artifact: Artifact = {
			abi: [{ type: 'function', name: 'f', inputs: [], outputs: [], stateMutability: 'view' }],
			evm: { bytecode: { object: '6080' }, deployedBytecode: { object: '6000' } },
		}

		it.each([
			'class',
			'export',
			'extends',
			'void',
			'with',
			'yield',
			'await',
			'eval',
			'arguments',
			'createContract',
			'Contract',
		])('generates valid modules for a contract named %s', (name) => {
			for (const includeBytecode of [true, false]) {
				for (const moduleType of ['ts', 'mjs', 'dts'] as const) {
					const sourceFile = expectNoSyntaxErrors(
						generate({ [name]: artifact }, moduleType, includeBytecode),
						moduleType,
					)
					expect(exportedNames(sourceFile).sort()).toEqual([name, 'artifacts'].sort())
				}
				for (const moduleType of ['ts', 'mjs', 'cjs'] as const) {
					const exports = evaluate(
						generate({ [name]: artifact }, moduleType, includeBytecode),
						moduleType,
						'@tevm/contract',
					)
					expect(exports[name]).toEqual(expectedContract(name, artifact, includeBytecode))
				}
			}
		})

		it('keeps the plain export form for ordinary contract names', () => {
			expect(generate({ Counter: artifact }, 'mjs', true)).toContain('export const Counter = createContract(_Counter);')
			expect(generate({ Counter: artifact }, 'dts', true)).toContain('export const Counter: Contract<')
			expect(generate({ class: artifact }, 'mjs', true)).toContain('export { _tevm_class as class };')
			expect(generate({ class: artifact }, 'dts', false)).toContain('export { _tevm_class as class };')
		})
	})
})
