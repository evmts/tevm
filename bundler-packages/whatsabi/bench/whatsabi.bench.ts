import { bench, describe } from 'vitest'
import { contractUriPattern, knownChains, parseUri } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const uris = [
	'evm://1/0x6B175474E89094C44Da98b954EedeAC495271d0F',
	'evm://10/0x4200000000000000000000000000000000000006',
	'evm://8453/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
	'evm://42161/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1?followProxies=true',
]

describe('@tevm/whatsabi', () => {
	bench(
		'contractUriPattern regex test (4 chains)',
		() => {
			for (const uri of uris) {
				if (!contractUriPattern.test(uri)) throw new Error(`failed on ${uri}`)
			}
		},
		benchOpts,
	)

	bench(
		'parseUri (4 chain URIs)',
		() => {
			for (const uri of uris) {
				const parsed = parseUri(uri as any)
				if (!parsed.address) throw new Error('unexpected')
			}
		},
		benchOpts,
	)

	bench(
		'knownChains lookup',
		() => {
			const keys = Object.keys(knownChains)
			if (keys.length === 0) throw new Error('unexpected')
		},
		benchOpts,
	)
})
