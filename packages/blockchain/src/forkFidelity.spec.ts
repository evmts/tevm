import { mainnet, optimism } from '@tevm/common'
import { http } from 'viem'
import { describe, expect, it } from 'vitest'
import { createBaseChain } from './createBaseChain.js'
import { getBlockFromRpc } from './utils/getBlockFromRpc.js'

const mainnetRpcUrl = process.env['TEVM_RPC_URLS_MAINNET']?.split(',')[0]
const optimismRpcUrl = process.env['TEVM_RPC_URLS_OPTIMISM']?.split(',')[0]

describe('fork block fidelity', () => {
	it.skipIf(!mainnetRpcUrl)('reconstructs post-Dencun mainnet block 20,000,000', async () => {
		const common = mainnet.copy()
		const transport = http(mainnetRpcUrl)({})
		const [block, rpcBlock] = await getBlockFromRpc(
			createBaseChain({ common }),
			{ transport, blockTag: 20_000_000n },
			common,
		)

		expect(block.transactions.some((transaction) => transaction.type === 3)).toBe(true)
		expect(await block.transactionsTrieIsValid()).toBe(true)
		expect(`0x${Buffer.from(block.hash()).toString('hex')}`).toBe(rpcBlock.hash)
	})

	it.skipIf(!optimismRpcUrl)('reconstructs an OP mainnet block containing a deposit transaction', async () => {
		const common = optimism.copy()
		const transport = http(optimismRpcUrl)({})
		const [block, rpcBlock] = await getBlockFromRpc(
			createBaseChain({ common }),
			{ transport, blockTag: 142_153_711n },
			common,
		)

		expect(rpcBlock.transactions.some((transaction) => transaction.type === '0x7e')).toBe(true)
		expect(block.transactions).toHaveLength(rpcBlock.transactions.length)
		const depositIndex = block.transactions.findIndex((transaction) => transaction.type === 0x7e)
		expect(depositIndex).toBeGreaterThanOrEqual(0)
		expect(`0x${Buffer.from(block.transactions[depositIndex]!.hash()).toString('hex')}`).toBe(
			rpcBlock.transactions[depositIndex]!.hash,
		)
		expect(await block.transactionsTrieIsValid()).toBe(true)
		expect(`0x${Buffer.from(block.hash()).toString('hex')}`).toBe(rpcBlock.hash)
	})
})
