type Uri = {
	fsPath: string
}

type Document = {
	languageId: string
}

type Client = {
	start(): Promise<unknown>
	stop(): Promise<unknown>
}

type Dependencies = {
	joinPath(base: Uri, ...segments: string[]): Uri
	createClient(
		id: string,
		name: string,
		serverOptions: unknown,
		clientOptions: unknown,
	): Client
	activateAutoInsertion(clients: Client[], selector: (document: Document) => boolean): void
	transportKindIpc: unknown
	supportLabsVersion: unknown
	languageServerProtocol: unknown
}

export const supportedLanguages = ['solidity', 'typescript', 'javascript'] as const

export async function activateExtension(extensionUri: Uri, dependencies: Dependencies) {
	const serverModule = dependencies.joinPath(extensionUri, 'dist', 'server.js')
	const serverOptions = {
		run: {
			module: serverModule.fsPath,
			transport: dependencies.transportKindIpc,
			options: { execArgv: [] },
		},
		debug: {
			module: serverModule.fsPath,
			transport: dependencies.transportKindIpc,
			options: { execArgv: ['--nolazy', '--inspect=6009'] },
		},
	}
	const clientOptions = {
		documentSelector: supportedLanguages.map((language) => ({ language })),
		initializationOptions: {},
	}
	const client = dependencies.createClient(
		'tevm-language-server',
		'Tevm Language Server',
		serverOptions,
		clientOptions,
	)
	await client.start()
	dependencies.activateAutoInsertion(
		[client],
		(document) => supportedLanguages.includes(document.languageId as (typeof supportedLanguages)[number]),
	)
	return {
		client,
		exports: {
			volarLabs: {
				version: dependencies.supportLabsVersion,
				languageClients: [client],
				languageServerProtocol: dependencies.languageServerProtocol,
			},
		},
	}
}
