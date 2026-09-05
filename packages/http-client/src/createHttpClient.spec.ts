import { once } from 'node:events'
import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
import { parseAbi } from 'viem'
import { expect, it } from 'vitest'
import { createHttpClient } from './createHttpClient.js'

it('executes native calls and account/state helpers through a real HTTP server', async () => {
	const local = createMemoryClient()
	const server = createServer(local)
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	const client = createHttpClient({ url: `http://127.0.0.1:${(server.address() as { port: number }).port}` })
	try {
		expect(await client.getChainId()).toBe(31337)
		const address = '0x0000000000000000000000000000000000000123'
		await client.tevm.setAccount({ address, balance: 42n, deployedBytecode: '0x602a60005260206000f3' })
		expect(await client.getBalance({ address })).toBe(42n)
		expect((await client.tevm.getAccount({ address })).balance).toBe(42n)
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
		await client.tevm.deal({ address, amount: 99n })
		await client.tevm.loadState(state)
		expect(await client.getBalance({ address })).toBe(42n)
		await client.tevm.mine()
		expect(await client.getBlockNumber()).toBe(1n)
		await expect(client.request({ method: 'missing' as never })).rejects.toThrow('Method not found')
	} finally {
		await new Promise<void>((resolve) => server.close(() => resolve()))
		await local.tevmClose()
	}
})
