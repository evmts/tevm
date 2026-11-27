import { createMemoryClient } from '@tevm/memory-client'
import { parseAbi } from 'viem'
import { describe, expect, it } from 'vitest'
import { tevmViemExtension } from './tevmViemExtension.js'

const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000123' as const
const SECOND_ADDRESS = '0x0000000000000000000000000000000000000456' as const
const RETURN_42_RUNTIME = '0x602a60005260206000f3' as const
const RETURN_42_INITCODE = '0x600a600c600039600a6000f3602a60005260206000f3' as const
const ANSWER_ABI = parseAbi(['function answer() view returns (uint256)'])

describe('tevmViemExtension', () => {
	it('binds every convenience action on client.tevm to native RPC', async () => {
		const local = createMemoryClient()
		const client = local.extend(tevmViemExtension())
		try {
			await client.tevm.setAccount({ address: CONTRACT_ADDRESS, deployedBytecode: RETURN_42_RUNTIME })
			await client.tevm.deal({ address: CONTRACT_ADDRESS, amount: 42n })
			expect((await client.tevm.getAccount({ address: CONTRACT_ADDRESS })).balance).toBe(42n)
			expect((await client.tevm.call({ to: CONTRACT_ADDRESS })).rawData).toMatch(/2a$/)
			expect(
				(
					await client.tevm.contract({
						address: CONTRACT_ADDRESS,
						abi: ANSWER_ABI,
						functionName: 'answer',
					})
				).data,
			).toBe(42n)
			const state = await client.tevm.dumpState()
			await client.tevm.loadState(state)
			expect((await client.tevm.deploy({ bytecode: RETURN_42_INITCODE })).createdAddress).toMatch(/^0x/)
			await client.tevm.mine()
			expect(await client.getBlockNumber()).toBe(2n)
		} finally {
			await local.tevmClose()
		}
	})

	it('exposes top-level tevm* aliases identical to client.tevm methods', async () => {
		const local = createMemoryClient()
		const client = local.extend(tevmViemExtension())
		try {
			expect(client.tevmCall).toBe(client.tevm.call)
			expect(client.tevmContract).toBe(client.tevm.contract)
			expect(client.tevmDeploy).toBe(client.tevm.deploy)
			expect(client.tevmGetAccount).toBe(client.tevm.getAccount)
			expect(client.tevmSetAccount).toBe(client.tevm.setAccount)
			expect(client.tevmMine).toBe(client.tevm.mine)
			expect(client.tevmDumpState).toBe(client.tevm.dumpState)
			expect(client.tevmLoadState).toBe(client.tevm.loadState)
			expect(client.tevmDeal).toBe(client.tevm.deal)

			await client.tevmSetAccount({ address: SECOND_ADDRESS, balance: 100n, deployedBytecode: RETURN_42_RUNTIME })
			await client.tevmDeal({ address: SECOND_ADDRESS, amount: 250n })
			const account = await client.tevmGetAccount({ address: SECOND_ADDRESS })
			expect(account.balance).toBe(250n)
			expect(account.deployedBytecode).toBe(RETURN_42_RUNTIME)

			const callResult = await client.tevmCall({ to: SECOND_ADDRESS })
			expect(callResult.rawData).toMatch(/2a$/)

			const contractResult = await client.tevmContract({
				address: SECOND_ADDRESS,
				abi: ANSWER_ABI,
				functionName: 'answer',
			})
			expect(contractResult.data).toBe(42n)

			const snapshot = await client.tevmDumpState()
			await client.tevmDeal({ address: SECOND_ADDRESS, amount: 1n })
			expect((await client.tevmGetAccount({ address: SECOND_ADDRESS })).balance).toBe(1n)

			await client.tevmLoadState(snapshot)
			expect((await client.tevmGetAccount({ address: SECOND_ADDRESS })).balance).toBe(250n)

			await client.tevmMine({ blocks: 3 })
			expect(await client.getBlockNumber()).toBe(3n)
		} finally {
			await local.tevmClose()
		}
	})

	it('isolates state cleanly across independent extended memory clients', async () => {
		const clientA = createMemoryClient().extend(tevmViemExtension())
		const clientB = createMemoryClient().extend(tevmViemExtension())
		try {
			await clientA.tevmDeal({ address: CONTRACT_ADDRESS, amount: 777n })
			expect((await clientA.tevmGetAccount({ address: CONTRACT_ADDRESS })).balance).toBe(777n)
			expect((await clientB.tevmGetAccount({ address: CONTRACT_ADDRESS })).balance).toBe(0n)
		} finally {
			await clientA.tevmClose()
			await clientB.tevmClose()
		}
	})
})
