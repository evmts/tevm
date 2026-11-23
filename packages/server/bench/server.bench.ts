import type { AddressInfo } from 'node:net'
import { Readable } from 'node:stream'
import { createMemoryClient } from '@tevm/memory-client'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createServer } from '../src/index.js'
import { getRequestBody } from '../src/internal/getRequestBody.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

let client: ReturnType<typeof createMemoryClient>
let server: ReturnType<typeof createServer>
let url: string

const blockNumberBody = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] })
const batchBody = JSON.stringify(
	Array.from({ length: 10 }, (_, i) => ({ jsonrpc: '2.0', id: i + 1, method: 'eth_chainId', params: [] })),
)
const largeChunks = Array.from({ length: 64 }, () => Buffer.alloc(1024, 0x61))

beforeAll(async () => {
	client = createMemoryClient()
	await client.tevmReady()
	server = createServer(client)
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
	const addr = server.address() as AddressInfo
	url = `http://127.0.0.1:${addr.port}`
})

afterAll(async () => {
	await new Promise<void>((resolve) => server.close(() => resolve()))
	await client.tevmClose()
})

describe('@tevm/server', () => {
	bench(
		'HTTP JSON-RPC eth_blockNumber (loopback)',
		async () => {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: blockNumberBody,
			})
			const json = (await res.json()) as { result: string }
			if (!json.result) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'HTTP JSON-RPC 10-request batch (loopback)',
		async () => {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: batchBody,
			})
			const json = (await res.json()) as Array<{ result: string }>
			if (!Array.isArray(json) || json.length !== 10) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'getRequestBody (64 KB multi-chunk stream)',
		async () => {
			const stream = Readable.from(largeChunks)
			const body = await getRequestBody(stream as any, { maxBodySize: 1024 * 1024 })
			if (typeof body !== 'string' || body.length !== 65536) throw new Error('unexpected')
		},
		benchOpts,
	)
})
