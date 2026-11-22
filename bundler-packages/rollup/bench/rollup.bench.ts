import { bench, describe } from 'vitest'
import { rollupPluginTevm } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/rollup-plugin', () => {
	bench(
		'rollupPluginTevm() instantiation',
		() => {
			const plugin = rollupPluginTevm()
			if (!plugin) throw new Error('unexpected')
		},
		benchOpts,
	)
})
