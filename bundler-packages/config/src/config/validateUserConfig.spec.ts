import { runSync } from 'effect/Effect'
import { describe, expect, it } from 'vitest'
import type { CompilerConfig } from '../types.js'
import { ConfigFnThrowError, InvalidConfigError, validateUserConfig } from './validateUserConfig.js'

describe(validateUserConfig.name, () => {
	it('should return the CompilerConfig if it is valid', () => {
		const validConfigs: Array<CompilerConfig> = [
			{
				foundryProject: true,
				remappings: { foo: 'bar' },
				libs: ['lib1', 'lib2'],
			},
			{
				foundryProject: '../forge',
				remappings: { foo: 'bar' },
				libs: ['lib1', 'lib2'],
			},
			{
				foundryProject: false,
				remappings: { foo: 'bar' },
				libs: ['lib1', 'lib2'],
			},
			{ foundryProject: false, remappings: { foo: 'bar' } },
			{ foundryProject: false, libs: ['lib1', 'lib2'] },
			{ remappings: { foo: 'bar' }, libs: ['lib1', 'lib2'] },
			{ foundryProject: false },
			{ libs: ['lib1', 'lib2'] },
			{ libs: [] },
			{ remappings: { foo: 'bar' } },
			{ remappings: {} },
			{ remappings: undefined, foundryProject: undefined, libs: undefined },
			{},
		]
		validConfigs.forEach((config) => {
			expect(runSync(validateUserConfig(() => config))).toEqual(config)
		})
	})

	it(`should throw an ${InvalidConfigError.name} if the config is invalid`, () => {
		const invalidConfig: Array<any> = [
			'foo',
			true,
			false,
			undefined,
			null,
			{ foundryProject: 5 },
			{ remappings: '{foo: "bar"}' },
			{ remappings: [] },
			{ libs: { lib: 'lib1' } },
			{ unknownProperty: 'foo' },
		]
		invalidConfig.forEach((config) => {
			expect(() => runSync(validateUserConfig(() => config))).toThrowErrorMatchingSnapshot()
		})
	})

	it(`should throw an ${ConfigFnThrowError.name} if config factory throws`, () => {
		const errStr = 'ooops'
		expect(() =>
			runSync(
				validateUserConfig(() => {
					throw errStr
				}),
			),
		).toThrowErrorMatchingInlineSnapshot('[(FiberFailure) Error: Provided config factory threw an error: ooops]')
		const err = new Error(errStr)
		expect(() =>
			runSync(
				validateUserConfig(() => {
					throw err
				}),
			),
		).toThrowErrorMatchingInlineSnapshot('[(FiberFailure) Error: Provided config factory threw an error: ooops]')
		const wierdError = {}
		expect(() =>
			runSync(
				validateUserConfig(() => {
					throw wierdError
				}),
			),
		).toThrowErrorMatchingInlineSnapshot('[(FiberFailure) Error: Provided config factory threw an error: ]')
	})

	// Regression: found by the Lean differential fuzz in specs/lean/host
	it('should keep a `__proto__` remapping prefix as an own key', () => {
		const config = JSON.parse('{"remappings":{"__proto__":"lib/proto/","foo":"bar"}}')
		const validated = runSync(validateUserConfig(() => config))
		expect(Object.entries(validated.remappings ?? {})).toEqual([
			['__proto__', 'lib/proto/'],
			['foo', 'bar'],
		])
		expect(Object.getPrototypeOf(validated.remappings)).toBe(Object.prototype)
	})

	it('should still reject a non-string `__proto__` remapping target', () => {
		const config = JSON.parse('{"remappings":{"__proto__":5}}')
		expect(() => runSync(validateUserConfig(() => config))).toThrow('Expected string, actual 5')
	})
})
