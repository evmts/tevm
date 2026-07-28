import { optimism } from '@tevm/common'
import { http } from 'viem'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryClient } from './createMemoryClient.js'

const testAddress = '0x1000000000000000000000000000000000000001'

describe('Anvil-compatible Vitest lifecycle', () => {
	const client = createMemoryClient()
	let snapshotId: `0x${string}`

	beforeAll(async () => {
		await client.tevmReady()
	})

	beforeEach(async () => {
		snapshotId = await client.request({
			method: 'anvil_snapshot',
			params: [],
		})
	})

	afterEach(async () => {
		expect(
			await client.request({
				method: 'anvil_revert',
				params: [snapshotId],
			}),
		).toBe(true)
	})

	it('uses the memory client request method as an Anvil-compatible endpoint', async () => {
		await client.request({
			method: 'anvil_setBalance',
			params: [testAddress, '0x2a'],
		})
		expect(
			await client.request({
				method: 'anvil_mine',
				params: ['0x1', '0x0'],
			}),
		).toBeNull()

		expect(
			await client.request({
				method: 'eth_getBalance',
				params: [testAddress, 'latest'],
			}),
		).toBe('0x2a')
	})

	it('mines one block when anvil_mine is called without parameters', async () => {
		const blockNumber = await client.getBlockNumber()
		expect(await client.request({ method: 'anvil_mine' } as never)).toBeNull()
		expect(await client.getBlockNumber()).toBe(blockNumber + 1n)
	})

	it('starts the next test from the reverted snapshot', async () => {
		expect(
			await client.request({
				method: 'eth_getBalance',
				params: [testAddress, 'latest'],
			}),
		).toBe('0x0')
	})
})

describe('Anvil-compatible reset between tests', () => {
	const client = createMemoryClient()

	beforeAll(async () => {
		await client.tevmReady()
	})

	beforeEach(async () => {
		await client.request({
			method: 'anvil_reset',
			params: [],
		})
	})

	it('can mutate state after a reset', async () => {
		await client.request({
			method: 'anvil_setCode',
			params: [testAddress, '0x6000'],
		})
		expect(await client.getCode({ address: testAddress })).toBe('0x6000')
	})

	it('restores initial state before the next test', async () => {
		expect(await client.getCode({ address: testAddress })).toBeUndefined()
	})
})

describe('Anvil-compatible fork reset', () => {
	it.skipIf(!process.env['TEVM_RUN_LIVE_FORK_TESTS'])('resets a live Optimism fork to its initial block', async () => {
		const client = createMemoryClient({
			common: optimism,
			fork: { transport: http('https://mainnet.optimism.io')({}) },
			miningConfig: { type: 'manual' },
		})
		await client.tevmReady()
		const initialBlock = await client.getBlockNumber()

		expect(
			await client.request({
				method: 'anvil_mine',
				params: ['0x1', '0x0'],
			}),
		).toBeNull()
		expect(await client.getBlockNumber()).toBe(initialBlock + 1n)

		await client.request({
			method: 'anvil_reset',
			params: [],
		})
		expect(await client.getBlockNumber()).toBe(initialBlock)
	})
})

describe('Anvil-compatible JSON-RPC errors', () => {
	const client = createMemoryClient()

	beforeAll(async () => {
		await client.tevmReady()
	})

	it('returns -32602 for invalid priority-method parameters', async () => {
		const invalidRequests = [
			{ method: 'anvil_setBalance', params: [] },
			{ method: 'anvil_setCode', params: [] },
			{ method: 'anvil_setNonce', params: [] },
			{ method: 'anvil_setStorageAt', params: [] },
			{ method: 'anvil_mine', params: ['0x1', '0x0', '0x0'] },
			{ method: 'anvil_setNextBlockBaseFeePerGas', params: [] },
			{ method: 'anvil_snapshot', params: [true] },
			{ method: 'anvil_revert', params: [] },
			{ method: 'anvil_reset', params: [true] },
			{ method: 'anvil_dumpState', params: [true] },
			{ method: 'anvil_loadState', params: [] },
		] as const

		for (const request of invalidRequests) {
			await expect(client.request(request as never)).rejects.toMatchObject({ code: -32602 })
		}
	})

	it('names unavailable Anvil methods in explicit -32601 errors', async () => {
		const unavailableMethods = [
			'anvil_getBlobByHash',
			'anvil_getBlobsByTransactionHash',
			'anvil_getBlobSidecarsByBlockId',
			'anvil_getGenesisTime',
			'anvil_impersonateSignature',
			'anvil_dealERC20',
			'anvil_setERC20Balance',
			'anvil_setERC20Allowance',
			'anvil_mine_detailed',
			'anvil_reorg',
			'anvil_rollback',
			'anvil_addCapability',
			'anvil_setExecutor',
		] as const

		for (const method of unavailableMethods) {
			await expect(client.request({ method, params: [] } as never)).rejects.toMatchObject({
				code: -32601,
				message: expect.stringContaining(method),
			})
		}
	})
})
