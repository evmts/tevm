import { createContract } from '@tevm/contract'
import { bench, describe } from 'vitest'
import { definePredeploy } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

const addressedContract = createContract({
	name: 'BenchPredeploy',
	humanReadableAbi: ['function get() view returns (uint256)'],
	bytecode: '0x600a600c600039600a6000f3602a60005260206000f3',
	deployedBytecode: '0x602a60005260206000f3',
}).withAddress('0x0000000000000000000000000000000000002323')

const predeploy = definePredeploy(addressedContract)

describe('@tevm/predeploys', () => {
	bench(
		'definePredeploy creation',
		() => {
			const p = definePredeploy(addressedContract)
			if (!p.contract.address) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'predeploy.predeploy() accessor',
		() => {
			const desc = predeploy.predeploy()
			if (!desc.address) throw new Error('unexpected')
		},
		benchOpts,
	)
})
