import { createMemoryClient, parseEther, PREFUNDED_ACCOUNTS } from 'tevm'
import { SimpleContract } from 'tevm/contract'
import { describe, expect, it } from 'vitest'

describe('local testing documentation', () => {
	it('mines an ETH transfer and exposes its receipt', async () => {
		const client = createMemoryClient({ miningConfig: { type: 'manual' } })
		const alice = PREFUNDED_ACCOUNTS[0].address
		const bob = '0x1111111111111111111111111111111111111111'

		const { txHash } = await client.tevmCall({
			from: alice,
			to: bob,
			value: parseEther('1'),
			addToMempool: true,
		})

		expect(txHash).toBeDefined()
		if (!txHash) throw new Error('transaction was not added to the txpool')

		await client.tevmMine({ blockCount: 1 })

		const receipt = await client.getTransactionReceipt({ hash: txHash })
		expect(receipt.status).toBe('success')
		expect(await client.getBalance({ address: bob })).toBe(parseEther('1'))
	})

	it('writes, mines, and reads contract state', async () => {
		const client = createMemoryClient({ miningConfig: { type: 'manual' } })
		const contract = SimpleContract.withAddress('0x2222222222222222222222222222222222222222')

		await client.setCode({
			address: contract.address,
			bytecode: contract.deployedBytecode,
		})

		const hash = await client.writeContract({
			account: PREFUNDED_ACCOUNTS[0],
			address: contract.address,
			abi: contract.abi,
			functionName: 'set',
			args: [42n],
		})

		await client.mine({ blocks: 1 })
		await client.waitForTransactionReceipt({ hash })

		expect(
			await client.readContract({
				address: contract.address,
				abi: contract.abi,
				functionName: 'get',
			}),
		).toBe(42n)
	})

	it('restores a snapshot', async () => {
		const client = createMemoryClient()
		const account = '0x3333333333333333333333333333333333333333'
		const snapshotId = await client.snapshot()

		await client.setBalance({ address: account, value: 100n })
		expect(await client.getBalance({ address: account })).toBe(100n)

		await client.revert({ id: snapshotId })
		expect(await client.getBalance({ address: account })).toBe(0n)
	})

	it('sets the next block timestamp', async () => {
		const client = createMemoryClient()
		const timestamp = 2_000_000_000n

		await client.setNextBlockTimestamp({ timestamp })
		await client.mine({ blocks: 1 })

		const block = await client.getBlock({ blockTag: 'latest' })
		expect(block.timestamp).toBe(timestamp)
	})

	it('collects live opcode steps and a returned trace', async () => {
		const client = createMemoryClient()
		const contract = '0x4444444444444444444444444444444444444444'

		await client.tevmSetAccount({
			address: contract,
			deployedBytecode: '0x6001600055',
		})

		const opcodes: string[] = []
		const result = await client.tevmCall({
			from: PREFUNDED_ACCOUNTS[0].address,
			to: contract,
			createTrace: true,
			onStep(step, next) {
				opcodes.push(step.opcode.name)
				next?.()
			},
		})

		expect(result.errors).toBeUndefined()
		expect(opcodes).toEqual(['PUSH1', 'PUSH1', 'SSTORE'])
		expect(result.trace?.structLogs).toHaveLength(3)
	})

	it('serves EIP-1193 requests without JSON-RPC envelopes', async () => {
		const client = createMemoryClient()

		expect(await client.request({ method: 'eth_chainId' })).toBe('0x384')
		expect(await client.request({ method: 'eth_blockNumber' })).toBe('0x0')
	})
})
