import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createContract } from '../contract/index.js'
import { createMemoryClient } from '../memory-client/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

const counterContract = createContract({
	name: 'Counter',
	humanReadableAbi: ['function get() view returns (uint256)'],
	deployedBytecode: '0x602a60005260206000f3',
}).withAddress('0x0000000000000000000000000000000000007001')

let client: ReturnType<typeof createMemoryClient>

beforeAll(async () => {
	client = createMemoryClient()
	await client.tevmReady()
	await client.tevmSetAccount({
		address: counterContract.address,
		deployedBytecode: counterContract.deployedBytecode,
	})
})

afterAll(async () => {
	await client.tevmClose()
})

describe('tevm (meta facade)', () => {
	bench(
		'facade createMemoryClient + tevmContract read',
		async () => {
			const res = await client.tevmContract(counterContract.read.get())
			if (res.data !== 42n) throw new Error('unexpected')
		},
		benchOpts,
	)
})
