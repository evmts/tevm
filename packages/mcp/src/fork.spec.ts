import { describe, expect, it } from 'vitest'
import { createSessionManager } from './createSessionManager.js'
import { executeTool } from './executeTool.js'

describe('Tevm MCP public RPC fork', () => {
	it('forks real Ethereum mainnet and reads live contract storage', async () => {
		const sessions = createSessionManager()
		const fork: any = await executeTool(
			'evm_fork_chain',
			{ url: 'https://ethereum-rpc.publicnode.com', chain: 'mainnet' },
			sessions,
		)
		expect(fork.chainId).toBe(1)
		expect(BigInt(fork.blockNumber)).toBeGreaterThan(20_000_000n)

		const weth: any = await executeTool(
			'evm_get_account',
			{
				session: fork.handle,
				address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
				storageSlot: '0x00',
			},
			sessions,
		)
		expect(weth.isContract).toBe(true)
		expect(weth.code.length).toBeGreaterThan(100)
		expect(weth.storageValue).toMatch(/^0x[0-9a-f]{64}$/i)
		expect(weth.storageValue).not.toBe(`0x${'0'.repeat(64)}`)
	})
})
