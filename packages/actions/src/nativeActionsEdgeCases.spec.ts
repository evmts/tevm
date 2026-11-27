import { createZevmEngine } from '@tevm/node'
import { parseAbi, toHex, zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'
import {
	tevmCall,
	tevmContract,
	tevmDeal,
	tevmDeploy,
	tevmDumpState,
	tevmGetAccount,
	tevmLoadState,
	tevmMine,
	tevmSetAccount,
} from './index.js'

const TARGET = '0x0000000000000000000000000000000000000abc' as const
const SECOND = '0x0000000000000000000000000000000000000def' as const
const RETURN_42_RUNTIME = '0x602a60005260206000f3' as const
const RETURN_99_RUNTIME = '0x606360005260206000f3' as const
const REVERT_RUNTIME = '0x60006000fd' as const
const SLOAD_SLOT0_RUNTIME = '0x5f545f5260205ff3' as const

describe('native @tevm/actions edge cases', () => {
	it('simulates runtime code overrides via tevmCall({ code }) without mutating chain state', async () => {
		const engine = createZevmEngine()
		try {
			const result = await tevmCall(engine, { code: RETURN_42_RUNTIME })
			expect(result.rawData).toBe(toHex(42n, { size: 32 }))
			expect(await engine.request({ method: 'eth_getCode', params: [zeroAddress, 'latest'] })).toBe('0x')

			const mergedOverride = await tevmCall(engine, {
				to: TARGET,
				code: SLOAD_SLOT0_RUNTIME,
				stateOverride: {
					[TARGET.toUpperCase().replace('0X', '0x')]: {
						stateDiff: {
							[toHex(0n, { size: 32 })]: toHex(77n, { size: 32 }),
						},
					},
				},
			})
			expect(mergedOverride.rawData).toBe(toHex(77n, { size: 32 }))
		} finally {
			await engine.close()
		}
	})

	it('rejects runtime code overrides when submitting transactions', async () => {
		const engine = createZevmEngine()
		try {
			await expect(
				tevmCall(engine, {
					to: TARGET,
					code: RETURN_42_RUNTIME,
					addToBlockchain: true,
				}),
			).rejects.toThrow(TypeError)

			await expect(
				tevmCall(engine, {
					to: TARGET,
					code: RETURN_42_RUNTIME,
					addToMempool: true,
				}),
			).rejects.toThrow('Runtime code overrides require a simulated call')
		} finally {
			await engine.close()
		}
	})

	it('rejects non-object stateOverride entries when code override merges into stateOverride', async () => {
		const engine = createZevmEngine()
		try {
			await expect(
				tevmCall(engine, {
					to: TARGET,
					code: RETURN_42_RUNTIME,
					stateOverride: {
						[TARGET]: null as unknown as Record<string, unknown>,
					},
				}),
			).rejects.toThrow('Expected an account object in stateOverride')
		} finally {
			await engine.close()
		}
	})

	it('attaches txHash and reverted receipt when a mined transaction reverts', async () => {
		const engine = createZevmEngine()
		try {
			await tevmSetAccount(engine, { address: TARGET, deployedBytecode: REVERT_RUNTIME })
			await expect(
				tevmCall(engine, {
					to: TARGET,
					gas: 100000n,
					addToBlockchain: true,
				}),
			).rejects.toMatchObject({
				message: expect.stringMatching(/reverted/),
				txHash: expect.stringMatching(/^0x[0-9a-f]{64}$/),
				receipt: expect.objectContaining({ status: '0x0' }),
			})
		} finally {
			await engine.close()
		}
	})

	it('left-pads short storage keys and values in tevmSetAccount and round-trips via dump/load state', async () => {
		const engine = createZevmEngine()
		try {
			const empty = await tevmGetAccount(engine, { address: SECOND })
			expect(empty.balance).toBe(0n)
			expect(empty.nonce).toBe(0n)
			expect(empty.deployedBytecode).toBe('0x')

			await tevmSetAccount(engine, {
				address: TARGET,
				balance: 123456n,
				nonce: 5n,
				deployedBytecode: SLOAD_SLOT0_RUNTIME,
				storage: {
					'0x0': '0x2a',
					'0x1': '0xff',
				},
			})

			expect(await engine.request({ method: 'eth_getStorageAt', params: [TARGET, '0x0', 'latest'] })).toBe(
				toHex(42n, { size: 32 }),
			)
			expect(await engine.request({ method: 'eth_getStorageAt', params: [TARGET, '0x1', 'latest'] })).toBe(
				toHex(255n, { size: 32 }),
			)
			expect((await tevmCall(engine, { to: TARGET })).rawData).toBe(toHex(42n, { size: 32 }))

			const dump = await tevmDumpState(engine)
			await tevmSetAccount(engine, {
				address: TARGET,
				balance: 1n,
				nonce: 9n,
				deployedBytecode: RETURN_99_RUNTIME,
				storage: { '0x0': '0x01' },
			})
			expect((await tevmCall(engine, { to: TARGET })).rawData).toBe(toHex(99n, { size: 32 }))

			await tevmLoadState(engine, dump)
			const restored = await tevmGetAccount(engine, { address: TARGET })
			expect(restored.balance).toBe(123456n)
			expect(restored.nonce).toBe(5n)
			expect(restored.deployedBytecode).toBe(SLOAD_SLOT0_RUNTIME)
			expect((await tevmCall(engine, { to: TARGET })).rawData).toBe(toHex(42n, { size: 32 }))
		} finally {
			await engine.close()
		}
	})

	it('mines multiple blocks with explicit intervals and preserves monotonic timestamps', async () => {
		const engine = createZevmEngine()
		try {
			const before = (await engine.request({
				method: 'eth_getBlockByNumber',
				params: ['latest', false],
			})) as { number: string; timestamp: string }

			await tevmMine(engine, { blocks: 4, interval: 15 })

			const after = (await engine.request({
				method: 'eth_getBlockByNumber',
				params: ['latest', false],
			})) as { number: string; timestamp: string }

			expect(BigInt(after.number) - BigInt(before.number)).toBe(4n)
			expect(BigInt(after.timestamp)).toBeGreaterThanOrEqual(BigInt(before.timestamp) + 45n)
		} finally {
			await engine.close()
		}
	})

	it('deploys initcode and decodes ABI-typed contract reads via tevmContract', async () => {
		const engine = createZevmEngine()
		try {
			// Initcode deploying RETURN_99_RUNTIME (10 bytes: 606360005260206000f3)
			const initcode = '0x600a600c600039600a6000f3606360005260206000f3' as const
			const deploy = await tevmDeploy(engine, { bytecode: initcode })
			expect(deploy.createdAddress).toMatch(/^0x[0-9a-f]{40}$/i)

			const abi = parseAbi(['function value() view returns (uint256)'])
			const res = await tevmContract(engine, {
				address: deploy.createdAddress!,
				abi,
				functionName: 'value',
			})
			expect(res.data).toBe(99n)

			await tevmDeal(engine, { address: deploy.createdAddress!, amount: 500n })
			expect((await tevmGetAccount(engine, { address: deploy.createdAddress! })).balance).toBe(500n)
		} finally {
			await engine.close()
		}
	})
})
