import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { runSync } from 'effect/Effect'
import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'
import {
	FoundryConfigError,
	FoundryNotFoundError,
	InvalidRemappingsError,
	loadFoundryConfig,
} from './loadFoundryConfig.js'

vi.mock('node:child_process', async () => ({
	execFileSync: vi.fn(),
}))

const mockExecFileSync = execFileSync as MockedFunction<typeof execFileSync>
const foundryFixture = join(__dirname, '..', 'fixtures', 'withFoundry')
const foundryConfigOutput = JSON.stringify({
	libs: ['lib'],
	remappings: ['@solmate-utils/=lib/solmate/src/utils/'],
})

describe(loadFoundryConfig.name, () => {
	beforeEach(() => {
		mockExecFileSync.mockReset()
	})
	it('should return the remappings from foundry', () => {
		mockExecFileSync.mockReturnValueOnce(Buffer.from(foundryConfigOutput))
		let res = runSync(loadFoundryConfig('forge', foundryFixture))
		expect(res.libs).toEqual(['lib'])
		expect(res.remappings?.['@solmate-utils/']).toContain('lib/solmate/src/utils/')
		expect(mockExecFileSync).lastCalledWith('forge', ['config', '--json'], {
			cwd: foundryFixture,
		})
		mockExecFileSync.mockReturnValueOnce(Buffer.from(foundryConfigOutput))
		res = runSync(loadFoundryConfig(true, foundryFixture))
		expect(res.libs).toEqual(['lib'])
		expect(res.remappings?.['@solmate-utils/']).toContain('lib/solmate/src/utils/')
		expect(mockExecFileSync).lastCalledWith('forge', ['config', '--json'], {
			cwd: foundryFixture,
		})
		expect(mockExecFileSync).lastCalledWith('forge', ['config', '--json'], {
			cwd: foundryFixture,
		})
	})

	it('should keep a `__proto__` remapping prefix as an own key', () => {
		mockExecFileSync.mockReturnValueOnce(Buffer.from(JSON.stringify({ remappings: ['__proto__=lib/proto/'] })))
		const res = runSync(loadFoundryConfig(true, foundryFixture))
		expect(Object.entries(res.remappings ?? {})).toEqual([['__proto__', join(foundryFixture, 'lib/proto/')]])
	})

	it('should return an empty config if no foundryProject is passed in', () => {
		expect(runSync(loadFoundryConfig(undefined, foundryFixture))).toEqual({})
		expect(runSync(loadFoundryConfig(false, join(__dirname, '..', 'fixtures', 'withFoundry')))).toEqual({})
	})

	it(`should throw ${FoundryNotFoundError.name} if command is not found`, () => {
		mockExecFileSync.mockImplementationOnce(() => {
			throw new Error('forge not found')
		})
		expect(() => runSync(loadFoundryConfig('notforgecommand', foundryFixture))).toThrowErrorMatchingInlineSnapshot(`
			[(FiberFailure) Error: Failed to resolve forge config using "notforgecommand config --json" command. Make sure forge is installed and accessible and forge config --json works.
			note: forge is used to fetch remappings only if forgeConfig is set. If you would prefer to not use forge you can set remappings
			or lib directly in your Tevm compiler config and then Tevm will run without forge]
		`)
	})

	it(`should throw ${FoundryConfigError.name} in unlikely event foundry returns invalid json`, () => {
		mockExecFileSync.mockImplementationOnce(() => {
			return `
[profile.default]
not-a-json
				`
		})
		expect(() => runSync(loadFoundryConfig('forge', foundryFixture))).toThrowErrorMatchingInlineSnapshot(
			'[(FiberFailure) Error: Unable to resolve foundry config using forge config --json]',
		)
	})

	it(`should throw ${InvalidRemappingsError.name} in unlikey event foundry returns remappings not formatted as expected`, () => {
		const remap = 'not-fromatted-as-expected'
		mockExecFileSync.mockImplementationOnce(() => {
			return JSON.stringify({
				remappings: [remap],
			})
		})
		expect(() => runSync(loadFoundryConfig('forge', foundryFixture))).toThrowErrorMatchingInlineSnapshot(
			'[(FiberFailure) Error: Invalid remappings: not-fromatted-as-expected]',
		)
	})
})

describe('loadFoundryConfig shared remapping parsing', () => {
	beforeEach(() => {
		mockExecFileSync.mockReset()
	})

	it('parses forge remappings exactly like remappings.txt', () => {
		mockExecFileSync.mockReturnValueOnce(
			Buffer.from(JSON.stringify({ remappings: [' @a/ = lib/a=b/ ', 'constructor=lib/c/', 'prototype=lib/t/'] })),
		)
		const res = runSync(loadFoundryConfig(true, '/project'))
		expect(Object.entries(res.remappings ?? {})).toEqual([
			['@a/', '/project/lib/a=b/'],
			['constructor', '/project/lib/c/'],
			['prototype', '/project/lib/t/'],
		])
		expect(Object.getPrototypeOf(res.remappings)).toBe(Object.prototype)
	})

	it('rejects a non-array remappings value', () => {
		mockExecFileSync.mockReturnValueOnce(Buffer.from(JSON.stringify({ remappings: 'a=b' })))
		expect(() => runSync(loadFoundryConfig(true, '/project'))).toThrow('Invalid remappings: a=b')
	})
})
