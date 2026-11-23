import { describe, expect, it } from 'vitest'
import { WebpackPluginTevm } from './index.js'
import { unplugin } from './unplugin.js'

describe('@tevm/webpack-plugin', () => {
	it('exports WebpackPluginTevm constructor', () => {
		expect(WebpackPluginTevm).toBeDefined()
		expect(typeof WebpackPluginTevm).toBe('function')
	})

	it('creates a webpack plugin instance with an apply hook', () => {
		const plugin = new WebpackPluginTevm()
		expect(plugin).toBeDefined()
		expect(typeof plugin.apply).toBe('function')
	})

	it('accepts solc configuration options', () => {
		const plugin = new WebpackPluginTevm({ solc: '0.8.30' })
		expect(plugin).toBeDefined()
		expect(typeof plugin.apply).toBe('function')
	})

	it('exposes a configured unplugin instance', () => {
		expect(unplugin).toBeDefined()
		expect(typeof unplugin.webpack).toBe('function')
	})
})
