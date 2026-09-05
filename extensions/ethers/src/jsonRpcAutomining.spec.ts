import { parseEther, Wallet } from 'ethers'
import { afterEach, describe, expect, it } from 'vitest'
import { TevmProvider } from './TevmProvider.js'

const providers: TevmProvider[] = []
afterEach(async () => {
	for (const provider of providers.splice(0)) {
		provider.destroy()
		await provider.tevm.tevmClose()
	}
})

describe('native raw transaction mining through ethers', () => {
	it.each([true, false])('honors automining=%s and returns exact receipt state', async (auto) => {
		const provider = await TevmProvider.createMemoryProvider({ mining: { auto } })
		providers.push(provider)
		const wallet = Wallet.createRandom()
		await provider.tevm.tevmSetAccount({ address: wallet.address as `0x${string}`, balance: parseEther('10') })
		const raw = await wallet.signTransaction({
			chainId: 31337,
			nonce: 0,
			to: '0x0000000000000000000000000000000000000123',
			value: 1n,
			gasLimit: 21000n,
			maxFeePerGas: 2000000000n,
			maxPriorityFeePerGas: 1000000000n,
			type: 2,
		})
		const response = await provider.broadcastTransaction(raw)
		expect(await provider.getBlockNumber()).toBe(auto ? 1 : 0)
		if (!auto) {
			expect(await provider.getTransactionReceipt(response.hash)).toBeNull()
			await provider.tevm.tevmMine()
		}
		const receipt = await provider.getTransactionReceipt(response.hash)
		expect(receipt?.hash).toBe(response.hash)
		expect(receipt?.status).toBe(1)
		expect(await provider.getBalance('0x0000000000000000000000000000000000000123')).toBe(1n)
	})
})
