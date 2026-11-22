import { bench, describe } from 'vitest'
import { esbuildPluginTevm } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/esbuild-plugin', () => {
	bench(
		'esbuildPluginTevm() instantiation',
		() => {
			const plugin = esbuildPluginTevm()
			if (!plugin) throw new Error('unexpected')
		},
		benchOpts,
	)
})
