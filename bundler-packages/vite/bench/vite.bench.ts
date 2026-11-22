import { bench, describe } from 'vitest'
import { vitePluginTevm } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

describe('@tevm/vite-plugin', () => {
	bench(
		'vitePluginTevm() instantiation',
		() => {
			const plugin = vitePluginTevm()
			if (!plugin) throw new Error('unexpected')
		},
		benchOpts,
	)
})
