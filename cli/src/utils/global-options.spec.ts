import { afterEach, describe, expect, it } from 'vitest'
import { normalizeGlobalOptions, shouldRunDirectly } from './global-options.js'

const originalJson = process.env['TEVM_JSON']
const originalSession = process.env['TEVM_SESSION']

afterEach(() => {
	if (originalJson === undefined) delete process.env['TEVM_JSON']
	else process.env['TEVM_JSON'] = originalJson
	if (originalSession === undefined) delete process.env['TEVM_SESSION']
	else process.env['TEVM_SESSION'] = originalSession
})

describe('global CLI options', () => {
	it('extracts json and session flags from any command position', () => {
		const result = normalizeGlobalOptions([
			'node',
			'tevm',
			'set-account',
			'--json',
			'--session=demo',
			'--address',
			'0x01',
		])
		expect(result).toEqual({
			argv: ['node', 'tevm', 'set-account', '--address', '0x01'],
			json: true,
			session: 'demo',
		})
		expect(process.env['TEVM_JSON']).toBe('true')
		expect(process.env['TEVM_SESSION']).toBe('demo')
	})

	it('requires a session name', () => {
		expect(() => normalizeGlobalOptions(['node', 'tevm', 'call', '--session'])).toThrow('--session requires a name')
		expect(() => normalizeGlobalOptions(['node', 'tevm', 'call', '--session='])).toThrow('--session requires a name')
	})

	it('runs JSON actions directly without an editor', () => {
		expect(shouldRunDirectly({ json: true, run: false })).toBe(true)
		expect(shouldRunDirectly({ json: false, run: true })).toBe(true)
		expect(shouldRunDirectly({ json: false, run: false })).toBe(false)
	})
})
