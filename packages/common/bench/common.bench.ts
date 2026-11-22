import { bench, describe } from 'vitest'
import { arbitrum, base, mainnet, optimism, polygon, sepolia, tevmDefault } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/common', () => {
	bench(
		'chain preset lookup & clone (tevmDefault / mainnet / optimism / base)',
		() => {
			const chains = [tevmDefault, mainnet, optimism, base, arbitrum, polygon, sepolia]
			let sum = 0
			for (const chain of chains) {
				const copy = { ...chain, id: chain.id }
				sum += copy.id
			}
			if (sum <= 0) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'custom chain config derivation from tevmDefault',
		() => {
			const derived = {
				...tevmDefault,
				id: 900,
				name: 'BenchChain',
				rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
			}
			if (derived.id !== 900) throw new Error('unexpected')
		},
		benchOpts,
	)
})
