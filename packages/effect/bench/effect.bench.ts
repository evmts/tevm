import { fileURLToPath } from 'node:url'
import { runPromise, runSync } from 'effect/Effect'
import { bench, describe } from 'vitest'
import { fileExists, parseJson } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const smallJson = JSON.stringify({
	jsonrpc: '2.0',
	id: 1,
	method: 'eth_call',
	params: [{ to: '0x0000000000000000000000000000000000000001', data: '0x1234' }, 'latest'],
})
const largeJson = JSON.stringify({
	contracts: Array.from({ length: 50 }, (_, i) => ({
		name: `Contract${i}`,
		address: `0x${String(i + 1).padStart(40, '0')}`,
		abi: [
			{
				type: 'function',
				name: 'balanceOf',
				inputs: [{ name: 'owner', type: 'address' }],
				outputs: [{ type: 'uint256' }],
			},
			{
				type: 'function',
				name: 'transfer',
				inputs: [
					{ name: 'to', type: 'address' },
					{ name: 'amount', type: 'uint256' },
				],
				outputs: [{ type: 'bool' }],
			},
		],
	})),
})
const thisFile = fileURLToPath(import.meta.url)

describe('@tevm/effect', () => {
	bench(
		'parseJson (small JSON-RPC payload)',
		() => {
			const parsed = runSync(parseJson(smallJson))
			if (!parsed) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'parseJson (50-contract ABI manifest)',
		() => {
			const parsed = runSync(parseJson(largeJson))
			if (!parsed) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'fileExists (existing file)',
		async () => {
			const exists = await runPromise(fileExists(thisFile))
			if (!exists) throw new Error('unexpected')
		},
		benchOpts,
	)
})
