import { ContractFactory } from 'ethers'
import { afterEach, describe, expect, it } from 'vitest'
import { TevmProvider } from './TevmProvider.js'

const providers: TevmProvider[] = []
afterEach(async () => {
	for (const provider of providers.splice(0)) {
		provider.destroy()
		await provider.tevm.tevmClose()
	}
})

describe('native ethers provider', () => {
	it('supports reads, state mutation, deployment and ABI calls', async () => {
		const provider = await TevmProvider.createMemoryProvider()
		providers.push(provider)
		expect((await provider.getNetwork()).chainId).toBe(31337n)
		const address = '0x0000000000000000000000000000000000000123'
		await provider.tevm.tevmSetAccount({ address, balance: 42n })
		expect(await provider.getBalance(address)).toBe(42n)
		const signer = await provider.getSigner()
		const factory = new ContractFactory(
			['function answer() view returns (uint256)'],
			'0x600a600c600039600a6000f3602a60005260206000f3',
			signer,
		)
		const contract = await factory.deploy()
		await contract.waitForDeployment()
		expect(await contract.getFunction('answer')()).toBe(42n)
		expect(await provider.getCode(await contract.getAddress())).toBe('0x602a60005260206000f3')
	})
	it('preserves raw RPC batches, errors and notification semantics', async () => {
		const provider = await TevmProvider.createMemoryProvider({ chainId: 123 })
		providers.push(provider)
		const result = await provider._send([
			{ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
			{ jsonrpc: '2.0', id: 2, method: 'missing', params: [] },
		])
		expect(result).toEqual([
			{ jsonrpc: '2.0', id: 1, result: '0x7b' },
			{ jsonrpc: '2.0', id: 2, error: { code: -32601, message: 'Method not found' } },
		])
		expect(JSON.parse(JSON.stringify(result))).toEqual(result)
		expect(await provider._send({ jsonrpc: '2.0', method: 'eth_chainId', params: [] } as never)).toEqual([])
	})
})
