import { bench, describe } from 'vitest'
import { rspackPluginTevm } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/rspack-plugin', () => {
	bench(
		'rspackPluginTevm() instantiation',
		() => {
			const plugin = rspackPluginTevm()
			if (!plugin) throw new Error('unexpected')
		},
		benchOpts,
	)
})
