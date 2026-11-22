import { bench, describe } from 'vitest'
import { isSolidity } from '../src/utils/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const paths = [
	'/repo/contracts/ERC20.sol',
	'/repo/contracts/Counter.s.sol',
	'/repo/src/index.ts',
	'/repo/src/types.d.ts',
	'/repo/node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol',
]

describe('@tevm/ts-plugin', () => {
	bench(
		'isSolidity classification (5 paths)',
		() => {
			let solCount = 0
			for (const p of paths) {
				if (isSolidity(p)) solCount += 1
			}
			if (solCount !== 3) throw new Error('unexpected')
		},
		benchOpts,
	)
})
