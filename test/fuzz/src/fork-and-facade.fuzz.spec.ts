import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMemoryClient } from '@tevm/memory-client'
import { moduleFactory } from '@tevm/resolutions'
import fc from 'fast-check'
import * as tevmRoot from 'tevm'
import { getAddress, toHex } from 'viem'
import { describe, expect, it } from 'vitest'
import { loadRemappings } from '../../../bundler-packages/config/src/json/loadRemappingstxt.js'
import { tolerantSignatureLookup } from '../../../bundler-packages/whatsabi/src/tolerantSignatureLookup.js'
import { addressArb, buildConstantReturnRuntime, bytes32Arb, hexBytesArb, u256Arb } from './arbitraries.js'
import { fcParams } from './config.js'

/**
 * Helper to execute an Effect 3.x Effect returned by TEVM's Effect-based packages.
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

/**
 * Spawns an isolated TEVM HTTP JSON-RPC server in a separate Node process so
 * synchronous native ZEVM fork RPC requests never deadlock the host event loop.
 */
async function startUpstreamServerProcess(): Promise<{ url: string; close: () => Promise<void> }> {
	const script = `
import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
const client = createMemoryClient({ chainId: 31337 })
await client.tevmReady()
const server = createServer(client)
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const addr = server.address()
process.stdout.write(JSON.stringify({ port: addr.port }) + '\\n')
process.on('SIGTERM', async () => {
	server.close()
	await client.tevmClose()
	process.exit(0)
})
`
	const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
		cwd: process.cwd(),
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	const port = await new Promise<number>((resolve, reject) => {
		let out = ''
		let err = ''
		const timer = setTimeout(() => reject(new Error(`Upstream server startup timed out: ${err}`)), 15_000)
		child.stderr.on('data', (chunk) => {
			err += chunk.toString()
		})
		child.stdout.on('data', (chunk) => {
			out += chunk.toString()
			const nl = out.indexOf('\n')
			if (nl !== -1) {
				clearTimeout(timer)
				try {
					const parsed = JSON.parse(out.slice(0, nl)) as { port: number }
					resolve(parsed.port)
				} catch (e) {
					reject(e)
				}
			}
		})
		child.once('exit', (code) => {
			clearTimeout(timer)
			reject(new Error(`Upstream server exited prematurely with code ${code}: ${err}`))
		})
	})

	return {
		url: `http://127.0.0.1:${port}`,
		close: async () => {
			child.kill('SIGTERM')
			await new Promise<void>((resolve) => {
				child.once('exit', () => resolve())
				setTimeout(() => {
					child.kill('SIGKILL')
					resolve()
				}, 3000)
			})
		},
	}
}

async function upstreamRpc(url: string, method: string, params: unknown[] = []): Promise<unknown> {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	})
	const json = (await res.json()) as { result?: unknown; error?: { message: string } }
	if (json.error) throw new Error(json.error.message)
	return json.result
}

describe('Cross-process fork, tevm facade parity, moduleFactory, remappings.txt, and signature lookup fuzzing', () => {
	it('fuzz: forked native ZEVM node faithfully mirrors upstream state, isolates local overrides, and reverts cleanly', async () => {
		const upstream = await startUpstreamServerProcess()
		try {
			const seededMap = new Map<
				`0x${string}`,
				{
					addr: `0x${string}`
					balance: bigint
					nonce: bigint
					slot: `0x${string}`
					val: `0x${string}`
					codeWord: bigint
				}
			>()
			// Seed upstream with several fuzzed accounts/storage/contracts before forking.
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 0x5000, max: 0x5fff }).map((n) => getAddress(toHex(BigInt(n), { size: 20 }))),
					u256Arb,
					fc.bigInt({ min: 0n, max: 500n }),
					bytes32Arb,
					bytes32Arb,
					u256Arb,
					async (addr, balance, nonce, slot, val, codeWord) => {
						const runtime = buildConstantReturnRuntime(codeWord)
						await upstreamRpc(upstream.url, 'anvil_setBalance', [addr, toHex(balance)])
						await upstreamRpc(upstream.url, 'anvil_setNonce', [addr, toHex(nonce)])
						await upstreamRpc(upstream.url, 'anvil_setCode', [addr, runtime])
						await upstreamRpc(upstream.url, 'anvil_setStorageAt', [addr, slot, val])
						seededMap.set(addr, { addr, balance, nonce, slot, val, codeWord })
					},
				),
				fcParams('io', { numRuns: 10 }),
			)
			const seeded = Array.from(seededMap.values())
			await upstreamRpc(upstream.url, 'evm_mine')

			const forkClient = createMemoryClient({ fork: { url: upstream.url } })
			try {
				await forkClient.tevmReady()
				for (const entry of seeded) {
					const acc = await forkClient.tevmGetAccount({ address: entry.addr })
					expect(acc.balance).toBe(entry.balance)
					expect(acc.nonce).toBe(entry.nonce)
					expect(acc.deployedBytecode.toLowerCase()).toBe(buildConstantReturnRuntime(entry.codeWord).toLowerCase())
					const storage = await forkClient.getStorageAt({ address: entry.addr, slot: entry.slot })
					expect(storage?.toLowerCase()).toBe(entry.val.toLowerCase())
					const callRes = await forkClient.tevmCall({ to: entry.addr })
					expect(callRes.rawData.toLowerCase()).toBe(toHex(entry.codeWord, { size: 32 }).toLowerCase())
				}

				// Fuzz local overrides + snapshot/revert without mutating upstream!
				await fc.assert(
					fc.asyncProperty(
						fc.integer({ min: 0, max: seeded.length - 1 }),
						u256Arb,
						bytes32Arb,
						async (idx, overrideBalance, overrideVal) => {
							const target = seeded[idx]!
							const snap = (await forkClient.transport.tevm.request({ method: 'evm_snapshot' })) as `0x${string}`
							await forkClient.tevmSetAccount({
								address: target.addr,
								balance: overrideBalance,
								storage: { [target.slot]: overrideVal },
							})
							expect((await forkClient.tevmGetAccount({ address: target.addr })).balance).toBe(overrideBalance)
							// Upstream MUST remain completely untouched.
							const upstreamBal = BigInt(
								(await upstreamRpc(upstream.url, 'eth_getBalance', [target.addr, 'latest'])) as string,
							)
							expect(upstreamBal).toBe(target.balance)

							// Revert MUST restore exact forked values.
							expect(await forkClient.transport.tevm.request({ method: 'evm_revert', params: [snap] })).toBe(true)
							expect((await forkClient.tevmGetAccount({ address: target.addr })).balance).toBe(target.balance)
							const revertedSlot = await forkClient.getStorageAt({ address: target.addr, slot: target.slot })
							expect(revertedSlot?.toLowerCase()).toBe(target.val.toLowerCase())
						},
					),
					fcParams('io', { numRuns: 15 }),
				)
			} finally {
				await forkClient.tevmClose()
			}
		} finally {
			await upstream.close()
		}
	})

	it('fuzz: tevm root facade exports behave identically to direct @tevm/* package imports', async () => {
		const client = tevmRoot.createMemoryClient()
		try {
			await client.tevmReady()
			await fc.assert(
				fc.asyncProperty(addressArb, u256Arb, hexBytesArb(0, 32), async (addr, balance, bytesHex) => {
					await client.tevmDeal({ address: addr, amount: balance })
					const acc = await client.tevmGetAccount({ address: addr })
					expect(acc.balance).toBe(balance)

					const rawBytes = tevmRoot.hexToBytes(bytesHex)
					expect(tevmRoot.bytesToHex(rawBytes)).toBe(bytesHex.toLowerCase())
				}),
				fcParams('io', { numRuns: 40 }),
			)
		} finally {
			await client.tevmClose()
		}
	})

	it('fuzz: @tevm/config loadRemappingsTxt handles arbitrary remappings.txt content without crashing', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'tevm-remappings-fuzz-'))
		try {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc
							.array(
								fc.tuple(fc.stringMatching(/^[a-zA-Z0-9_@/-]{1,12}\/$/), fc.stringMatching(/^[a-zA-Z0-9_/-]{1,16}\/$/)),
								{ maxLength: 8 },
							)
							.map((pairs) => pairs.map(([k, v]) => `${k}=${v}`).join('\n')),
						fc.string({ maxLength: 256 }),
					),
					async (content) => {
						await writeFile(join(dir, 'remappings.txt'), content, 'utf8')
						const res = await runTevmEffect(loadRemappings(dir))
						expect(['Right', 'Left']).toContain(res._tag)
					},
				),
				fcParams('io', { numRuns: 80 }),
			)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('fuzz: @tevm/resolutions moduleFactory resolves arbitrary DAGs and cyclic imports safely', async () => {
		const dir = await mkdtemp(join(tmpdir(), 'tevm-modfactory-fuzz-'))
		try {
			const fileA = join(dir, 'A.sol')
			const fileB = join(dir, 'B.sol')
			const fileC = join(dir, 'C.sol')
			const fsSync = await import('node:fs')
			const fsPromises = await import('node:fs/promises')
			const fao = {
				readFile: fsPromises.readFile,
				readFileSync: fsSync.readFileSync,
				existsSync: fsSync.existsSync,
				exists: async (p: string) => fsSync.existsSync(p),
			}

			await fc.assert(
				fc.asyncProperty(fc.boolean(), fc.boolean(), fc.boolean(), async (aImportsB, bImportsC, cImportsA) => {
					const srcA = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n${aImportsB ? 'import "./B.sol";\n' : ''}contract A {}\n`
					const srcB = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n${bImportsC ? 'import "./C.sol";\n' : ''}contract B {}\n`
					const srcC = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n${cImportsA ? 'import "./A.sol";\n' : ''}contract C {}\n`
					await Promise.all([writeFile(fileA, srcA), writeFile(fileB, srcB), writeFile(fileC, srcC)])

					const res = await runTevmEffect<Map<string, { id: string; importedIds: string[] }>>(
						moduleFactory(fileA, srcA, {}, [], fao as never, false),
					)
					expect(res._tag).toBe('Right')
					if (res._tag === 'Right') {
						expect(res.right.has(fileA)).toBe(true)
						if (aImportsB) expect(res.right.has(fileB)).toBe(true)
						if (aImportsB && bImportsC) expect(res.right.has(fileC)).toBe(true)
					}
				}),
				fcParams('io', { numRuns: 24 }),
			)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})

	it('fuzz: @tevm/whatsabi tolerantSignatureLookup safely wraps failing or quirky lookup backends', async () => {
		await fc.assert(
			fc.asyncProperty(
				hexBytesArb(4, 4),
				bytes32Arb,
				fc.boolean(),
				fc.array(fc.string({ minLength: 1, maxLength: 48 }), { maxLength: 4 }),
				async (selector, topicHash, shouldThrow, results) => {
					const wrapped = tolerantSignatureLookup({
						loadFunctions: async () => {
							if (shouldThrow) throw new Error('network down')
							return results
						},
						loadEvents: async () => {
							if (shouldThrow) throw new Error('network down')
							return results
						},
					} as never)
					const fns = await wrapped.loadFunctions(selector)
					const evs = await wrapped.loadEvents(topicHash)
					expect(fns).toEqual(shouldThrow ? [] : results)
					expect(evs).toEqual(shouldThrow ? [] : results)
				},
			),
			fcParams('pure', { numRuns: 150 }),
		)
	})
})
