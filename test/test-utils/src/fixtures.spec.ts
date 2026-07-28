import { describe, expect, it } from 'vitest'
import { createMemoryClient } from '../../../packages/memory-client/src/createMemoryClient.js'
import {
	AdvancedContract,
	BlockReader,
	ErrorContract,
	getAlchemyUrl,
	SimpleContract,
	TestERC20,
	TestERC721,
	transports,
} from './index.js'

const address = '0x0000000000000000000000000000000000000042'

describe('@tevm/test-utils fixtures', () => {
	it('ships usable ABI and bytecode for every exported contract fixture', () => {
		for (const contract of [AdvancedContract, BlockReader, ErrorContract, SimpleContract, TestERC20, TestERC721]) {
			expect(contract.humanReadableAbi.length).toBeGreaterThan(0)
			expect(contract.bytecode).toMatch(/^0x[0-9a-f]+$/)
			expect(contract.deployedBytecode).toMatch(/^0x[0-9a-f]+$/)
		}
	})

	it('executes the SimpleContract fixture in a real in-process EVM', async () => {
		const client = createMemoryClient()
		await client.tevmReady()
		await client.tevmSetAccount({ address, deployedBytecode: SimpleContract.deployedBytecode })
		const contract = SimpleContract.withAddress(address)
		await client.tevmContract({ ...contract.write.set(42n), addToBlockchain: true })
		const result = await client.tevmContract(contract.read.get())
		expect(result.data).toBe(42n)
	})

	it('preserves revert information from the ErrorContract fixture', async () => {
		const client = createMemoryClient()
		await client.tevmReady()
		await client.tevmSetAccount({ address, deployedBytecode: ErrorContract.deployedBytecode })
		await expect(
			client.tevmContract(ErrorContract.withAddress(address).write.revertWithStringError()),
		).rejects.toThrow('This is a string error message')
	})

	it('uses the exported Optimism transport against a pinned real block', async () => {
		const block = await transports.optimism.request({
			method: 'eth_getBlockByNumber',
			params: ['0x7bfa480', false],
		})
		expect((block as { hash: string }).hash).toBe(
			'0xaf131f54209291613f0b74e61903405ea84bf30368ea5c6cf787992351ad843d',
		)
	}, 30_000)

	it('builds an Alchemy URL with an explicit key', () => {
		expect(getAlchemyUrl('optimism', 'test-key')).toBe('https://opt-mainnet.g.alchemy.com/v2/test-key')
	})
})
