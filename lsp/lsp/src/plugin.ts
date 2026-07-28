import type { LanguageServicePlugin } from '@volar/language-service'
import ts from 'typescript/lib/tsserverlibrary.js'
import { create as createTsService } from 'volar-service-typescript'
import { language } from './language.js'

const solidityService: LanguageServicePlugin = {
	name: 'tevm-solidity',
	capabilities: {
		diagnosticProvider: {
			interFileDependencies: false,
			workspaceDiagnostics: false,
		},
	},
	create: () => ({
		provideDiagnostics() {
			return []
		},
	}),
}

export const plugin = () => {
	return {
		languagePlugins: [language],
		servicePlugins: [solidityService, ...createTsService(ts)],
		watchFileExtensions: ['sol', 'js', 'ts', 'tsx', 'jsx', 'json'],
	}
}
