import * as fsSync from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCache } from '@tevm/bundler-cache'
import { defineConfig } from '@tevm/config'
import { parseJson } from '@tevm/effect'
import { generateRuntime } from '@tevm/runtime'
import { knownChains, parseUri } from '@tevm/whatsabi'
import fc from 'fast-check'
import ts from 'typescript'
import { getAddress } from 'viem'
import { describe, expect, it } from 'vitest'
import { resolveImports } from '../../../bundler-packages/resolutions/src/resolveImports.js'
import { addressArb, hexBytesArb, solidityIdentifierArb } from './arbitraries.js'
import { fcParams } from './config.js'

/**
 * Helper to execute an Effect 3.x Effect returned by TEVM's Effect-based packages
 * without colliding with test/fuzz's Effect 4.1.1 runtime used by @smthrs/fuzz.
 */
async function runTevmEffect<A>(
	effect3: unknown,
): Promise<{ _tag: 'Right'; right: A } | { _tag: 'Left'; left: unknown }> {
	// @ts-expect-error internal Effect 3.x ESM runtime from @tevm/effect
	const effMod = await import('../../../packages/effect/node_modules/effect/dist/esm/Effect.js')
	const exit = await effMod.runPromiseExit(effect3 as never)
	if (exit._tag === 'Success') {
		return { _tag: 'Right', right: exit.value as A }
	}
	return { _tag: 'Left', left: exit.cause }
}

const getSyntaxErrors = (code: string, scriptKind: ts.ScriptKind): string[] => {
	const sf = ts.createSourceFile('fuzz.ts', code, ts.ScriptTarget.ESNext, true, scriptKind)
	const diagnostics = (sf as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics ?? []
	return diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
}

describe('Bundler packages and @tevm/effect fuzzing', () => {
	it('fuzz: @tevm/effect parseJson handles arbitrary strings, JSONC comments, and trailing commas without throwing', async () => {
		// 1) Valid JSON values ALWAYS parse back identically.
		await fc.assert(
			fc.asyncProperty(fc.jsonValue({ maxDepth: 4 }), async (value) => {
				const text = JSON.stringify(value)
				const res = await runTevmEffect(parseJson(text))
				expect(res._tag).toBe('Right')
				if (res._tag === 'Right') {
					expect(res.right).toEqual(JSON.parse(text))
				}
			}),
			fcParams('pure', { numRuns: 250 }),
		)

		// 2) JSONC with line/block comments and trailing commas succeeds.
		await fc.assert(
			fc.asyncProperty(
				fc.dictionary(fc.stringMatching(/^[a-zA-Z0-9_]{1,12}$/), fc.integer(), { minKeys: 1, maxLength: 6 } as never),
				fc.string({ maxLength: 32 }).map((s) => s.replace(/[\r\n]/g, ' ')),
				async (obj, comment) => {
					const entries = Object.entries(obj)
						.map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`)
						.join('\n')
					const jsonc = `// ${comment}\n{\n${entries}\n}`
					const res = await runTevmEffect(parseJson(jsonc))
					expect(res._tag).toBe('Right')
					if (res._tag === 'Right') {
						expect(res.right).toEqual(obj)
					}
				},
			),
			fcParams('pure', { numRuns: 150 }),
		)

		// 3) Arbitrary adversarial strings NEVER crash or throw synchronously; they return Right or Left(ParseJsonError).
		await fc.assert(
			fc.asyncProperty(fc.string({ maxLength: 256 }), async (raw) => {
				const res = await runTevmEffect(parseJson(raw))
				expect(['Right', 'Left']).toContain(res._tag)
			}),
			fcParams('pure', { numRuns: 300 }),
		)
	})

	it('fuzz: @tevm/runtime generateTevmBody produces syntactically valid JS/TS/CJS/DTS for arbitrary ABIs and hostile NatSpec', async () => {
		const hostileTextArb = fc.oneof(
			fc.string({ maxLength: 64 }),
			fc.constantFrom(
				'normal notice',
				'contains */ closing comment */ twice',
				'line1\nline2\r\nline3 */ evil()',
				'unicode 🚀 \u2028 \u2029',
				'quotes "double" \'single\' `backtick` ${expr}',
			),
		)

		const solTypeArb = fc.constantFrom('uint256', 'int256', 'address', 'bool', 'bytes32', 'string', 'bytes', 'uint8')
		const fnAbiArb = fc.record({
			type: fc.constant('function' as const),
			name: solidityIdentifierArb,
			stateMutability: fc.constantFrom('pure', 'view', 'nonpayable', 'payable') as fc.Arbitrary<
				'pure' | 'view' | 'nonpayable' | 'payable'
			>,
			inputs: fc.array(fc.record({ name: solidityIdentifierArb, type: solTypeArb }), { maxLength: 3 }),
			outputs: fc.array(fc.record({ name: fc.constant(''), type: solTypeArb }), { maxLength: 2 }),
		})

		await fc.assert(
			fc.asyncProperty(
				solidityIdentifierArb,
				fc.array(fnAbiArb, { maxLength: 4 }),
				hostileTextArb,
				hostileTextArb,
				hexBytesArb(0, 32),
				fc.constantFrom('ts', 'mjs', 'cjs', 'dts') as fc.Arbitrary<'ts' | 'mjs' | 'cjs' | 'dts'>,
				fc.boolean(),
				async (contractName, abi, contractNotice, methodNotice, bytecode, moduleType, includeBytecode) => {
					const rawHex = bytecode.slice(2)
					const artifacts = {
						[contractName]: {
							abi,
							userdoc: {
								kind: 'user' as const,
								version: 1,
								notice: contractNotice,
								methods: {
									'foo()': { notice: methodNotice },
								},
							},
							evm: {
								bytecode: { object: rawHex },
								deployedBytecode: { object: rawHex },
							},
						},
					}

					const res = await runTevmEffect<string>(
						generateRuntime(artifacts as never, moduleType, includeBytecode, '@tevm/contract'),
					)
					expect(res._tag).toBe('Right')
					if (res._tag !== 'Right') return

					const scriptKind = moduleType === 'ts' || moduleType === 'dts' ? ts.ScriptKind.TS : ts.ScriptKind.JS
					const errors = getSyntaxErrors(res.right, scriptKind)
					expect(errors).toEqual([])
				},
			),
			fcParams('pure', { numRuns: 200 }),
		)
	})

	it('fuzz: @tevm/resolutions resolveImports never crashes on arbitrary Solidity/comment/import inputs', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'tevm-resolutions-fuzz-'))
		const targetFile = join(dir, 'Dep.sol')
		const mainFile = join(dir, 'Main.sol')
		await writeFile(targetFile, '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Dep {}')
		try {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc.string({ maxLength: 256 }),
						fc.constantFrom(
							'import "./Dep.sol";',
							'/* import "./Missing.sol"; */\nimport "./Dep.sol";',
							'import { Dep } from "./Dep.sol";',
							'import "";',
							'import "./DoesNotExist.sol";',
							'/* unclosed comment\nimport "./Dep.sol";',
						),
						fc
							.tuple(fc.string({ maxLength: 48 }), fc.boolean())
							.map(
								([noise, includeValid]) =>
									`/* ${noise.replace(/\*\//g, '')} */\n${includeValid ? 'import "./Dep.sol";' : ''}`,
							),
					),
					fc.boolean(),
					async (code, sync) => {
						const res = await runTevmEffect(resolveImports(mainFile, code, {}, [], sync))
						expect(['Right', 'Left']).toContain(res._tag)
					},
				),
				fcParams('io', { numRuns: 100 }),
			)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('fuzz: @tevm/config defineConfig validates arbitrary user config shapes cleanly', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.oneof(
					fc.record({
						libs: fc.array(fc.stringMatching(/^[a-zA-Z0-9_/-]{1,20}$/), { maxLength: 4 }),
						remappings: fc.dictionary(
							fc.stringMatching(/^[a-zA-Z0-9_@/-]{1,16}\/$/),
							fc.stringMatching(/^[a-zA-Z0-9_/-]{1,20}\/$/),
							{ maxKeys: 4 },
						),
						debug: fc.boolean(),
						cacheDir: fc.stringMatching(/^[a-zA-Z0-9_.-]{1,16}$/),
					}),
					fc.record({
						libs: fc.constant(123 as never),
					}),
					fc.record({
						remappings: fc.constant('invalid' as never),
					}),
				),
				async (userConfig) => {
					const cfg = defineConfig(() => userConfig as never)
					const res = await runTevmEffect(cfg.configFn('/tmp/tevm-fuzz-config'))
					expect(['Right', 'Left']).toContain(res._tag)
				},
			),
			fcParams('pure', { numRuns: 100 }),
		)
	})

	it('fuzz: @tevm/bundler-cache preserves round-trip artifacts across sync and async APIs', async () => {
		const cacheDir = await mkdtemp(join(tmpdir(), 'tevm-cache-fuzz-'))
		try {
			const fileAccess = {
				readFile: fsPromises.readFile,
				readFileSync: fsSync.readFileSync,
				writeFile: fsPromises.writeFile,
				writeFileSync: fsSync.writeFileSync,
				exists: async (p: string) => fsSync.existsSync(p),
				existsSync: fsSync.existsSync,
				statSync: fsSync.statSync,
				stat: fsPromises.stat,
				mkdirSync: fsSync.mkdirSync,
				mkdir: fsPromises.mkdir,
			}
			const cache = createCache('.tevm', fileAccess as never, cacheDir)
			await fc.assert(
				fc.asyncProperty(
					fc.stringMatching(/^[A-Za-z0-9_]{1,16}$/),
					fc.string({ minLength: 1, maxLength: 128 }),
					fc.string({ minLength: 1, maxLength: 128 }),
					async (fileName, dtsContent, mjsContent) => {
						const solPath = join(cacheDir, `${fileName}.sol`)
						await cache.writeDts(solPath, dtsContent)
						expect(await cache.readDts(solPath)).toBe(dtsContent)
						expect(cache.readDtsSync(solPath)).toBe(dtsContent)

						cache.writeMjsSync(solPath, mjsContent)
						expect(cache.readMjsSync(solPath)).toBe(mjsContent)
						expect(await cache.readMjs(solPath)).toBe(mjsContent)
					},
				),
				fcParams('io', { numRuns: 40 }),
			)
		} finally {
			await rm(cacheDir, { recursive: true, force: true })
		}
	})

	it('fuzz: @tevm/whatsabi parseUri handles valid contract URIs and arbitrary malformed strings cleanly', () => {
		const validChainIds = Object.keys(knownChains).map((k) => Number(k))
		fc.assert(
			fc.property(
				fc.constantFrom(...validChainIds),
				addressArb,
				fc.option(fc.boolean(), { nil: undefined }),
				(chainId, addr, followProxies) => {
					const query = followProxies !== undefined ? `?followProxies=${followProxies}` : ''
					const uri = `evm://${chainId}/${addr}${query}` as never
					const parsed = parseUri(uri)
					expect(parsed).toBeDefined()
					expect(parsed?.chainId).toBe(chainId)
					expect(parsed?.address).toBe(getAddress(addr))
					expect(parsed?.followProxies).toBe(followProxies === true ? true : undefined)
				},
			),
			fcParams('pure', { numRuns: 200 }),
		)

		// Arbitrary adversarial strings MUST either return undefined or a valid ParsedUri (or cleanly reject bad EIP-55 checksum).
		fc.assert(
			fc.property(fc.string({ maxLength: 128 }), (raw) => {
				try {
					const parsed = parseUri(raw as never)
					if (parsed !== undefined) {
						expect(Number.isInteger(parsed.chainId)).toBe(true)
						expect(parsed.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
					}
				} catch (error) {
					expect(error).toBeInstanceOf(Error)
				}
			}),
			fcParams('pure', { numRuns: 300 }),
		)
	})
})
