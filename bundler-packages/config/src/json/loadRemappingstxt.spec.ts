import * as fs from 'node:fs'
import { runPromise } from 'effect/Effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRemappings } from './loadRemappingstxt.js'

// Mock fs readFileSync
vi.mock('node:fs', () => ({
	readFileSync: vi.fn(),
	existsSync: vi.fn(),
}))

describe('loadRemappings', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should handle empty remappings file', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('  \n  ')

		const result = await runPromise(loadRemappings('/path/to/config'))
		expect(result).toEqual({})
	})

	it('should parse valid remappings', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('@openzeppelin/=lib/openzeppelin/\n@solmate/=lib/solmate/src/')

		const result = await runPromise(loadRemappings('/path/to/config'))
		expect(result).toEqual({
			remappings: {
				'@openzeppelin/': '/path/to/config/lib/openzeppelin/',
				'@solmate/': '/path/to/config/lib/solmate/src/',
			},
		})
	})

	it('should handle remappings with empty lines', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('@openzeppelin/=lib/openzeppelin/\n\n@solmate/=lib/solmate/src/')

		const result = await runPromise(loadRemappings('/path/to/config'))

		// Blank lines must not introduce empty-string keys or undefined values
		expect(result).toEqual({
			remappings: {
				'@openzeppelin/': '/path/to/config/lib/openzeppelin/',
				'@solmate/': '/path/to/config/lib/solmate/src/',
			},
		})
	})

	it('should throw InvalidRemappingsError for invalid remapping format', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('@openzeppelin/lib/openzeppelin/\n@solmate/=lib/solmate/src/')

		await expect(runPromise(loadRemappings('/path/to/config'))).rejects.toThrow(
			'Invalid remapping @openzeppelin/lib/openzeppelin/',
		)
	})

	it('should return empty object when remappings file does not exist', async () => {
		vi.mocked(fs.readFileSync).mockImplementationOnce(() => {
			throw new Error('ENOENT')
		})

		const result = await runPromise(loadRemappings('/path/to/config'))
		expect(result).toEqual({})
	})

	it('should handle Windows paths in remappings', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('@openzeppelin/=lib\\windows\\path\\')

		// On Windows, paths may use backslashes
		const result = await runPromise(loadRemappings('C:\\path\\to\\config'))

		expect(result).toHaveProperty('remappings.@openzeppelin/')
		expect(result.remappings?.['@openzeppelin/']).toBe('C:\\path\\to\\config\\lib\\windows\\path\\')
	})

	it('should handle remappings with paths starting with slash', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('@openzeppelin/=/absolute/path/lib/openzeppelin/')

		const result = await runPromise(loadRemappings('/path/to/config'))

		expect(result).toHaveProperty('remappings.@openzeppelin/')
		// Should correctly handle paths starting with slash by removing the leading slash
		expect(result.remappings?.['@openzeppelin/']).toEqual('/path/to/config/absolute/path/lib/openzeppelin/')
	})

	it('should handle config path with trailing slash', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('@openzeppelin/=lib/openzeppelin/')

		const result = await runPromise(loadRemappings('/path/to/config/'))

		expect(result).toHaveProperty('remappings.@openzeppelin/')
		// Should not add double slash when config path already has trailing slash
		expect(result.remappings?.['@openzeppelin/']).toEqual('/path/to/config/lib/openzeppelin/')
	})

	// Regression: found by the Lean differential fuzz in specs/lean/host
	it('should keep a `__proto__` prefix instead of silently dropping the remapping', async () => {
		vi.mocked(fs.readFileSync).mockReturnValueOnce('__proto__=lib/proto/\n@solmate/=lib/solmate/src/')

		const result = await runPromise(loadRemappings('/path/to/config'))

		expect(Object.entries(result.remappings ?? {})).toEqual([
			['__proto__', '/path/to/config/lib/proto/'],
			['@solmate/', '/path/to/config/lib/solmate/src/'],
		])
	})
})
