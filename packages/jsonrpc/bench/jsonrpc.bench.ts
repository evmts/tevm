import { bench, describe } from 'vitest'
import { createJsonRpcFetcher } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

const fastFetcher = createJsonRpcFetcher({
	request: async ({ method }) => {
		if (method === 'eth_blockNumber') return '0x10'
		if (method === 'eth_chainId') return '0x7a69'
		const err = Object.assign(new Error('Method not found'), { code: -32601, data: '0x' })
		throw err
	},
})

describe('@tevm/jsonrpc', () => {
	bench(
		'createJsonRpcFetcher instantiation',
		() => {
			const f = createJsonRpcFetcher({ request: async () => '0x0' })
			if (!f) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'request (success envelope)',
		async () => {
			const res = await fastFetcher.request({ method: 'eth_blockNumber', id: 1 })
			if (!('result' in res)) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'request (error envelope formatting)',
		async () => {
			const res = await fastFetcher.request({ method: 'unknown_method', id: 2 })
			if (!('error' in res)) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'10 concurrent requests',
		async () => {
			const results = await Promise.all(
				Array.from({ length: 10 }, (_, i) => fastFetcher.request({ method: 'eth_chainId', id: i })),
			)
			if (results.length !== 10) throw new Error('unexpected')
		},
		benchOpts,
	)
})
