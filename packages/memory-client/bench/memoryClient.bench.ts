import { parseAbi } from 'viem'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createMemoryClient } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

const return42Bytecode = '0x602a60005260206000f3' as const
const contractAddr = '0x0000000000000000000000000000000000003001' as const
const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const
const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const
const getterAbi = parseAbi(['function get() view returns (uint256)'])

let client: ReturnType<typeof createMemoryClient>

beforeAll(async () => {
	client = createMemoryClient()
	await client.tevmReady()
	await client.tevmSetAccount({ address: contractAddr, deployedBytecode: return42Bytecode })
})

afterAll(async () => {
	await client.tevmClose()
})

describe('@tevm/memory-client', () => {
	bench(
		'createMemoryClient + tevmReady + tevmClose',
		async () => {
			const c = createMemoryClient()
			await c.tevmReady()
			await c.tevmClose()
		},
		{ time: 250, warmupTime: 50, warmupIterations: 3, throws: true },
	)

	bench(
		'viem getBlockNumber()',
		async () => {
			const bn = await client.getBlockNumber()
			if (bn < 0n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'viem getBalance()',
		async () => {
			const bal = await client.getBalance({ address: sender })
			if (bal <= 0n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'viem readContract()',
		async () => {
			const val = await client.readContract({
				address: contractAddr,
				abi: getterAbi,
				functionName: 'get',
			})
			if (val !== 42n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmContract() read',
		async () => {
			const res = await client.tevmContract({
				to: contractAddr,
				abi: getterAbi,
				functionName: 'get',
			})
			if (res.data !== 42n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmCall() + addToBlockchain (ETH transfer)',
		async () => {
			const res = await client.tevmCall({
				from: sender,
				to: recipient,
				value: 1n,
				addToBlockchain: true,
			})
			if (!res.txHash) throw new Error('unexpected')
		},
		benchOpts,
	)
})
