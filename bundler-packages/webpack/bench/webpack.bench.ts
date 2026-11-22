import { bench, describe } from 'vitest'
import { WebpackPluginTevm } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/webpack-plugin', () => {
	bench(
		'new WebpackPluginTevm() instantiation',
		() => {
			const plugin = new WebpackPluginTevm()
			if (!plugin) throw new Error('unexpected')
		},
		benchOpts,
	)
})
