import { createMemoryClient } from '@tevm/memory-client'
import { parseAbi } from 'viem'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { tevmViemExtension } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

const contractAddr = '0x0000000000000000000000000000000000005001' as const
const getterAbi = parseAbi(['function get() view returns (uint256)'])

let baseClient: ReturnType<typeof createMemoryClient>
let extended: ReturnType<typeof baseClient.extend<ReturnType<ReturnType<typeof tevmViemExtension>>>>

beforeAll(async () => {
	baseClient = createMemoryClient()
	await baseClient.tevmReady()
	extended = baseClient.extend(tevmViemExtension())
	await extended.tevmSetAccount({ address: contractAddr, deployedBytecode: '0x602a60005260206000f3' })
})

afterAll(async () => {
	await baseClient.tevmClose()
})

describe('@tevm/viem', () => {
	bench(
		'tevmViemExtension().tevmCall()',
		async () => {
			const res = await extended.tevm.call({ to: contractAddr, data: '0x' })
			if (!res.rawData) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmViemExtension().tevmContract()',
		async () => {
			const res = await extended.tevm.contract({ to: contractAddr, abi: getterAbi, functionName: 'get' })
			if (res.data !== 42n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmViemExtension().tevmGetAccount()',
		async () => {
			const res = await extended.tevm.getAccount({ address: contractAddr })
			if (!res.deployedBytecode) throw new Error('unexpected')
		},
		benchOpts,
	)
})
