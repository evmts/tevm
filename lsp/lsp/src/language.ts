import type { LanguagePlugin } from '@volar/language-core'
import { SolFile } from './SolFile.js'

export const language: LanguagePlugin<any, SolFile> = {
	getLanguageId(uri) {
		return uri.path.endsWith('.sol') ? 'solidity' : undefined
	},
	createVirtualCode(uri, languageId, snapshot) {
		if (languageId === 'solidity' || uri.path.endsWith('.sol')) {
			return new SolFile(uri.fsPath, snapshot)
		}
		return undefined
	},
	updateVirtualCode(_uri, solfile, snapshot) {
		solfile.update(snapshot)
		return solfile
	},
}
