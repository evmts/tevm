import path from 'node:path'
import ts from 'typescript/lib/tsserverlibrary.js'
import { describe, expect, it } from 'vitest'
import { language } from './language.js'
import { plugin } from './plugin.js'

const solidity = `
pragma solidity ^0.8.20;
contract Counter {
    uint256 public number;
    function increment() public { number++; }
}
`

describe('TEVM Solidity language server', () => {
	it('creates and updates a real TypeScript virtual file from Solidity', () => {
		const fileName = path.join(process.cwd(), 'fixtures', 'Counter.sol')
		const uri = { path: fileName, fsPath: fileName } as any
		const file = language.createVirtualCode?.(uri, 'solidity', ts.ScriptSnapshot.fromString(solidity), {} as any)
		expect(file).toBeDefined()
		const initialText = file?.snapshot.getText(0, file.snapshot.getLength())
		expect(initialText).toContain('createContract')
		expect(initialText).toContain('increment')

		language.updateVirtualCode?.(
			uri,
			file!,
			ts.ScriptSnapshot.fromString(solidity.replace('increment', 'decrement')),
			{} as any,
		)
		const updated = file?.snapshot
		expect(updated?.getText(0, updated.getLength())).toContain('decrement')
		expect(language.getLanguageId({ path: 'Counter.ts' } as any)).toBeUndefined()
	})

	it('registers Solidity and TypeScript services with Volar', async () => {
		const configuration = plugin()
		expect(configuration.languagePlugins).toContain(language)
		expect(configuration.watchFileExtensions).toContain('sol')
		expect(configuration.servicePlugins.length).toBeGreaterThan(1)
		const solidityService = configuration.servicePlugins.find((service) => service.name === 'tevm-solidity')
		expect(solidityService?.capabilities.diagnosticProvider).toBeDefined()
		const instance = solidityService?.create({} as any)
		expect(await instance?.provideDiagnostics?.({} as any, {} as any)).toEqual([])
	})
})
