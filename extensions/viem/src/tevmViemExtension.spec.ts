import { createMemoryClient } from '@tevm/memory-client'
import { parseAbi } from 'viem'
import { expect, it } from 'vitest'
import { tevmViemExtension } from './tevmViemExtension.js'

it('binds every convenience action to native RPC', async () => {
	const local = createMemoryClient()
	const client = local.extend(tevmViemExtension())
	const address = '0x0000000000000000000000000000000000000123'
	try {
		await client.tevm.setAccount({ address, deployedBytecode: '0x602a60005260206000f3' })
		await client.tevm.deal({ address, amount: 42n })
		expect((await client.tevm.getAccount({ address })).balance).toBe(42n)
		expect((await client.tevm.call({ to: address })).rawData).toMatch(/2a$/)
		expect(
			(
				await client.tevm.contract({
					address,
					abi: parseAbi(['function answer() view returns (uint256)']),
					functionName: 'answer',
				})
			).data,
		).toBe(42n)
		const state = await client.tevm.dumpState()
		await client.tevm.loadState(state)
		expect(
			(await client.tevm.deploy({ bytecode: '0x600a600c600039600a6000f3602a60005260206000f3' })).createdAddress,
		).toMatch(/^0x/)
		await client.tevm.mine()
		expect(await client.getBlockNumber()).toBe(2n)
	} finally {
		await local.tevmClose()
	}
})
