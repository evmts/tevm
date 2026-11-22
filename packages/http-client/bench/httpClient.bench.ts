import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createHttpClient } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

let memClient: ReturnType<typeof createMemoryClient>
let server: ReturnType<typeof createServer>
let httpClient: ReturnType<typeof createHttpClient>

const contractAddr = '0x0000000000000000000000000000000000004001' as const

beforeAll(async () => {
	memClient = createMemoryClient()
	await memClient.tevmReady()
	await memClient.tevmSetAccount({ address: contractAddr, deployedBytecode: '0x602a60005260206000f3' })
	server = createServer(memClient)
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
	const addr = server.address() as AddressInfo
	httpClient = createHttpClient({ url: `http://127.0.0.1:${addr.port}` })
})

afterAll(async () => {
	await new Promise<void>((resolve) => server.close(() => resolve()))
	await memClient.tevmClose()
})

describe('@tevm/http-client', () => {
	bench(
		'getBlockNumber() over HTTP',
		async () => {
			const bn = await httpClient.getBlockNumber({ cacheTime: 0 })
			if (bn < 0n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmCall() over HTTP',
		async () => {
			const res = await httpClient.tevmCall({ to: contractAddr, data: '0x' })
			if (!res.rawData) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmGetAccount() over HTTP',
		async () => {
			const acc = await httpClient.tevmGetAccount({ address: contractAddr })
			if (!acc.deployedBytecode) throw new Error('unexpected')
		},
		benchOpts,
	)
})
