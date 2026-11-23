import { flip, runPromise, runSync } from 'effect/Effect'
import { describe, expect, it } from 'vitest'
import { resolveImportPath } from './resolveImportPath.js'

describe('resolveImportPath', () => {
	it('should correctly resolve paths using Foundry remappings', async () => {
		const remappings = {
			'key1/': '/path/to/key1',
			'key2/': '/path/to/key2',
		} as const

		const importPath = await runPromise(resolveImportPath('/project/src', 'key1/somefile', remappings, [], false))
		expect(importPath).toMatchInlineSnapshot('"/path/to/key1somefile"')

		const importPath2 = await runPromise(resolveImportPath('/project/src', 'key2/somefile', remappings, [], false))
		expect(importPath2).toMatchInlineSnapshot('"/path/to/key2somefile"')
	})
	it('should correctly resolve paths using Foundry remappings syncronously', async () => {
		const remappings = {
			'key1/': '/path/to/key1',
			'key2/': '/path/to/key2',
		} as const

		const importPath = runSync(resolveImportPath('/project/src', 'key1/somefile', remappings, [], true))
		expect(importPath).toMatchInlineSnapshot('"/path/to/key1somefile"')

		const importPath2 = runSync(resolveImportPath('/project/src', 'key2/somefile', remappings, [], true))
		expect(importPath2).toMatchInlineSnapshot('"/path/to/key2somefile"')
	})

	it('should correctly resolve local imports', async () => {
		const importPath = await runPromise(resolveImportPath('/project/src', './somefile', {}, [], false))
		expect(importPath).toMatchInlineSnapshot('"/project/somefile"')
	})

	it('should return an error if not able to resolve', async () => {
		// Use a path we know won't resolve
		let error = await runPromise(flip(resolveImportPath(process.cwd(), 'non-existent-module-12345', {}, [], false)))
		expect(error._tag).toBe('CouldNotResolveImportError')
		expect(error.message).toContain('Could not resolve import non-existent-module-12345')

		// Test sync path
		error = runSync(flip(resolveImportPath(process.cwd(), 'non-existent-module-12345', {}, [], true)))
		expect(error._tag).toBe('CouldNotResolveImportError')
		expect(error.message).toContain('Could not resolve import non-existent-module-12345')
	})
})

describe('resolveImportPath regressions', () => {
	it('formats sync node resolutions like async ones', async () => {
		const sync = runSync(resolveImportPath(__filename, '@openzeppelin/contracts/token/ERC20/ERC20.sol', {}, [], true))
		const async = await runPromise(
			resolveImportPath(__filename, '@openzeppelin/contracts/token/ERC20/ERC20.sol', {}, [], false),
		)
		expect(sync).toBe(async)
		expect(sync).not.toContain('\\')
	})

	it('rejects remapped imports that escape the remapping target', () => {
		const remappings = { 'lib/': '/project/lib/', 'bare/': '/project/bare' }
		for (const importPath of ['lib/../../etc/passwd', 'bare//../../etc/passwd', 'bare/x/../../../etc']) {
			const error = runSync(flip(resolveImportPath('/project/src/A.sol', importPath, remappings, [], true)))
			expect(error._tag).toBe('CouldNotResolveImportError')
			expect((error.cause as Error).message).toContain('escapes remapping target')
		}
	})

	it('allows remapped imports that stay inside the remapping target', () => {
		const remappings = { 'lib/': '/project/lib/' }
		expect(runSync(resolveImportPath('/project/src/A.sol', 'lib/a/../b/B.sol', remappings, [], true))).toBe(
			'/project/lib/b/B.sol',
		)
	})
})
