import { runSync } from 'effect/Effect'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { generateTevmBody } from './generateTevmBody.js'

const artifact = (bytecode = '6080') =>
	({
		abi: [{ type: 'function', name: 'f', inputs: [], outputs: [], stateMutability: 'view' }],
		userdoc: { methods: {} },
		evm: { bytecode: { object: bytecode }, deployedBytecode: { object: bytecode } },
	}) as any

/** Artifacts with an own `__proto__` key, as solc output parsed by JSON.parse would have */
const withProto = (names: string[]) => {
	const artifacts: Record<string, unknown> = {}
	for (const name of names) {
		Object.defineProperty(artifacts, name, { value: artifact(), enumerable: true, writable: true, configurable: true })
	}
	return artifacts as any
}

const stub = 'const createContract = (params) => ({ created: true, params });\n'

const importEsm = async (code: string): Promise<Record<string, any>> =>
	import(/* @vite-ignore */ `data:text/javascript,${encodeURIComponent(stub + code)}`)

const evaluate = async (artifacts: any, moduleType: 'cjs' | 'mjs' | 'ts'): Promise<Record<string, any>> => {
	const body = runSync(generateTevmBody(artifacts, moduleType, true))
	if (moduleType === 'mjs') return importEsm(body)
	if (moduleType === 'ts') {
		const { outputText } = ts.transpileModule(body, {
			fileName: 'Contract.sol.ts',
			compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
		})
		return importEsm(outputText)
	}
	const module = { exports: {} as Record<string, any> }
	new Function('module', 'exports', stub + body)(module, module.exports)
	return module.exports
}

describe('generateTevmBody binding collisions', () => {
	for (const moduleType of ['cjs', 'mjs', 'ts'] as const) {
		it(`${moduleType}: contracts A and _A get distinct locals`, async () => {
			const exports = await evaluate({ A: artifact('aa'), _A: artifact('bb') }, moduleType)
			expect(exports['A'].params.name).toBe('A')
			expect(exports['A'].params.bytecode).toBe('0xaa')
			expect(exports['_A'].params.name).toBe('_A')
			expect(exports['_A'].params.bytecode).toBe('0xbb')
			expect(Object.keys(exports['artifacts'])).toEqual(['A', '_A'])
		})

		it(`${moduleType}: a contract named artifacts owns the artifacts export`, async () => {
			const exports = await evaluate({ Other: artifact(), artifacts: artifact() }, moduleType)
			expect(exports['artifacts'].created).toBe(true)
			expect(exports['artifacts'].params.name).toBe('artifacts')
			expect(exports['Other'].params.name).toBe('Other')
		})

		it(`${moduleType}: a contract named __proto__ is an own key of artifacts`, async () => {
			const exports = await evaluate(withProto(['__proto__', 'B']), moduleType)
			const artifacts = exports['artifacts']
			expect(Object.getPrototypeOf(artifacts)).toBe(Object.prototype)
			expect(Object.keys(artifacts)).toEqual(['__proto__', 'B'])
			expect(Object.hasOwn(artifacts, '__proto__')).toBe(true)
		})
	}

	it('cjs: exports a __proto__ contract as an own property without replacing the prototype', async () => {
		const exports = await evaluate(withProto(['__proto__']), 'cjs')
		expect(Object.getPrototypeOf(exports)).toBe(Object.prototype)
		expect(Object.getOwnPropertyDescriptor(exports, '__proto__')?.value.params.name).toBe('__proto__')
	})

	it('mjs: exports a __proto__ contract binding', async () => {
		const exports = await evaluate(withProto(['__proto__']), 'mjs')
		expect(Object.getOwnPropertyDescriptor(exports, '__proto__')?.value.params.name).toBe('__proto__')
	})

	it('emits computed __proto__ keys rather than prototype setters', () => {
		const body = runSync(generateTevmBody(withProto(['__proto__']), 'mjs', true))
		expect(body).toContain("['__proto__']:")
		expect(body).not.toContain('"__proto__":')
	})

	it('dts: unique declarations and no duplicate artifacts export', () => {
		const dts = runSync(generateTevmBody({ A: artifact(), _nameA: artifact(), artifacts: artifact() }, 'dts', true))
		const declared = [...dts.matchAll(/(?:declare|export) const (\w+)/g)].map(([, name]) => name)
		expect(new Set(declared).size).toBe(declared.length)
		expect(dts).not.toContain('export declare const artifacts')
		expect(declared).toContain('artifacts')
	})
})
