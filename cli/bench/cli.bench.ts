import { bench, describe } from 'vitest'
import { generateRandomName } from '../src/utils/generateRandomName.js'
import { parseCliAbi } from '../src/utils/parse-cli-abi.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const inlineAbiJson = JSON.stringify([
	{ type: 'function', name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
	{ type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
])

describe('@tevm/cli', () => {
	bench(
		'parseCliAbi (inline JSON ABI)',
		() => {
			const abi = parseCliAbi(inlineAbiJson)
			if (abi.length !== 2) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'generateRandomName()',
		() => {
			const name = generateRandomName()
			if (!name) throw new Error('unexpected')
		},
		benchOpts,
	)
})
