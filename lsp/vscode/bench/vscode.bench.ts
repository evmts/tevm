import { bench, describe } from 'vitest'
import { activateExtension, supportedLanguages } from '../src/activateExtension.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

const deps = {
	joinPath: (base: { fsPath: string }, ...segments: string[]) => ({
		fsPath: [base.fsPath, ...segments].join('/'),
	}),
	createClient: () => ({
		start: async () => {},
		stop: async () => {},
	}),
	activateAutoInsertion: () => {},
	transportKindIpc: 1,
	supportLabsVersion: '2.0.0',
	languageServerProtocol: {},
}

describe('@tevm/vscode', () => {
	bench(
		'activateExtension() wiring',
		async () => {
			const res = await activateExtension({ fsPath: '/ext' }, deps)
			if (!res.client || supportedLanguages.length === 0) throw new Error('unexpected')
		},
		benchOpts,
	)
})
