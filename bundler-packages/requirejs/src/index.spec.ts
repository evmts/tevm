import { describe, expect, it } from 'vitest'
import { requirejsFileAccessObject, requirejsPluginTevm } from './index.js'

describe('@tevm/requirejs index', () => {
	it('should export requirejsPluginTevm', () => {
		expect(requirejsPluginTevm).toBeDefined()
		expect(typeof requirejsPluginTevm).toBe('function')
	})

	it('should export requirejsFileAccessObject', () => {
		expect(requirejsFileAccessObject).toBeDefined()
		expect(typeof requirejsFileAccessObject).toBe('object')
	})
})
