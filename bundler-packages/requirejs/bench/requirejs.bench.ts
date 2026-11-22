import { bench, describe } from 'vitest'
import { requirejsPluginTevm } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const plugin = requirejsPluginTevm({})

describe('@tevm/requirejs-plugin', () => {
	bench(
		'requirejsPluginTevm() instantiation',
		() => {
			const p = requirejsPluginTevm({})
			if (typeof p.load !== 'function') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'plugin.normalize() path normalization',
		() => {
			const normalized = plugin.normalize('./contracts/Counter.sol', (n: string) => n)
			if (!normalized) throw new Error('unexpected')
		},
		benchOpts,
	)
})
