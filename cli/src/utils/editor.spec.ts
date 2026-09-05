import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { cleanupProject, createEditorProject, executeTsFile } from './editor.js'

it('runs editor projects against the installed native host without installing a registry engine', async () => {
	const address = '0x0000000000000000000000000000000000000123'
	const directory = await createEditorProject('call', { local: true }, async () => ({
		to: address,
		value: 0n,
		stateOverride: { [address]: { code: '0x602a60005260206000f3' } },
	}))
	try {
		expect(existsSync(join(directory, '.ready'))).toBe(true)
		expect(existsSync(join(directory, 'bun.lockb'))).toBe(false)
		expect(JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')).dependencies).toBeUndefined()
		expect(await executeTsFile(directory)).toEqual({ rawData: `0x${'0'.repeat(62)}2a` })
	} finally {
		cleanupProject(directory)
	}
}, 30000)
