import { createZevmEngine } from '@tevm/node'
import { createClient, parseAbi, toHex } from 'viem'
import { foundry } from 'viem/chains'
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { createMemoryClient } from './createMemoryClient.js'
import { createTevmTransport } from './createTevmTransport.js'
import type { MemoryClient } from './MemoryClient.js'
import { tevmViemActions } from './tevmViemActions.js'

const address = '0x0000000000000000000000000000000000000123'
const runtime = '0x602a60005260206000f3'
const initcode = '0x600a600c600039600a6000f3602a60005260206000f3'
const clients: MemoryClient[] = []
const create = (options?: Parameters<typeof createMemoryClient>[0]) => {
	const client = createMemoryClient(options)
	clients.push(client)
	return client
}
afterEach(async () => {
	await Promise.all(clients.splice(0).map((client) => client.tevmClose()))
})

describe('native memory client', () => {
	it('preserves viem actions and TEVM account/state helpers', async () => {
		const client = create()
		await client.tevmReady()
		expect(await client.getChainId()).toBe(31337)
		expect(await client.getBlockNumber()).toBe(0n)
		await client.tevmSetAccount({
			address,
			balance: 42n,
			nonce: 2n,
			deployedBytecode: runtime,
			storage: { [toHex(0n, { size: 32 })]: toHex(9n, { size: 32 }) },
		})
		expect(await client.getBalance({ address })).toBe(42n)
		expect(await client.getTransactionCount({ address })).toBe(2)
		expect(await client.getCode({ address })).toBe(runtime)
		expect(await client.getStorageAt({ address, slot: toHex(0n, { size: 32 }) })).toBe(toHex(9n, { size: 32 }))
		expect(await client.tevmGetAccount({ address })).toMatchObject({
			address,
			balance: 42n,
			nonce: 2n,
			deployedBytecode: runtime,
		})
		await client.tevmSetAccount({ address })
		await client.tevmDeal({ address, amount: 99n })
		const state = await client.tevmDumpState()
		const copy = create({ common: foundry })
		await copy.tevmLoadState(state)
		expect((await copy.tevmGetAccount({ address })).balance).toBe(99n)
		expect((await client.tevmCall({ to: address })).rawData).toBe(toHex(42n, { size: 32 }))
	})
	it('encodes and decodes ABI calls with native overrides and revert data', async () => {
		const client = create({ chainId: 123, name: 'test', key: 'native', account: address })
		expect(client.account?.address).toBe(address)
		expect(await client.getChainId()).toBe(123)
		await client.tevmSetAccount({ address, deployedBytecode: runtime })
		const abi = parseAbi(['function answer() view returns (uint256)'])
		const result = await client.tevmContract({ address, abi, functionName: 'answer' })
		expectTypeOf(result.data).toEqualTypeOf<bigint | undefined>()
		expect(result.data).toBe(42n)
		await expect(client.tevmContract({ abi, functionName: 'answer' })).rejects.toThrow('A contract address is required')
		expect(await client.readContract({ address, abi, functionName: 'answer' })).toBe(42n)
		const overridden = await client.tevmCall({
			to: address,
			from: address,
			value: 0n,
			gas: 100000n,
			gasPrice: 0n,
			blockTag: 'latest',
			stateOverride: { [address]: { code: '0x602b60005260206000f3' } },
		})
		expect(overridden.rawData).toBe(toHex(43n, { size: 32 }))
		await client.tevmSetAccount({ address, deployedBytecode: '0x63deadbeef6000526004601cfd' })
		await expect(client.tevmCall({ to: address })).rejects.toMatchObject({ code: 3, data: '0xdeadbeef' })
	})
	it('deploys contracts and mines queued transactions with receipts and block events', async () => {
		const client = create({ mining: { auto: false } })
		const blocks: unknown[] = []
		client.transport.tevm.events.on('block', (block) => blocks.push(block))
		const deployed = await client.tevmDeploy({ bytecode: initcode })
		expect(deployed.createdAddress).toMatch(/^0x[0-9a-f]{40}$/i)
		expect((await client.tevmCall({ to: deployed.createdAddress! })).rawData).toBe(toHex(42n, { size: 32 }))
		const [from] = await client.getAddresses()
		const queued = await client.tevmCall({ from, to: address, value: 1n, addToMempool: true })
		expect(queued.txHash).toMatch(/^0x[0-9a-f]{64}$/)
		await client.tevmMine({ blocks: 1, interval: 2 })
		expect((await client.getTransactionReceipt({ hash: queued.txHash! })).status).toBe('success')
		await client.tevmMine()
		expect(blocks.length).toBe(3)
		const pendingDeployment = await client.tevmDeploy({ bytecode: initcode, abi: [], args: [], addToMempool: true })
		expect(pendingDeployment.createdAddress).toBeUndefined()
		await client.tevmMine()
	})
	it('supports automatic mining and contract transaction submission', async () => {
		const client = create()
		const deployed = await client.tevmDeploy({ bytecode: initcode })
		expect(deployed.receipt).toMatchObject({ status: '0x1' })
		const result = await client.tevmContract({
			to: deployed.createdAddress!,
			abi: parseAbi(['function answer() returns (uint256)']),
			functionName: 'answer',
			addToBlockchain: true,
		})
		expect(result.txHash).toBeDefined()
		expect(result.data).toBeUndefined()
	})
	it('supports a supplied engine and standalone viem transport', async () => {
		const engine = createZevmEngine({ chainId: 31337 })
		const client = createClient({ transport: createTevmTransport({ engine }) }).extend(tevmViemActions())
		try {
			await client.tevmReady()
			expect(await client.request({ method: 'eth_chainId' })).toBe('0x7a69')
		} finally {
			await client.tevmClose()
		}
	})
})
