import * as serverProtocol from '@volar/language-server/protocol'
import { type ExportsInfoForLabs, activateAutoInsertion, supportLabsVersion } from '@volar/vscode'
import * as vscode from 'vscode'
import * as lsp from 'vscode-languageclient/node'
import { activateExtension } from './activateExtension.js'

let client: lsp.BaseLanguageClient

export async function activate(context: vscode.ExtensionContext) {
	const activated = await activateExtension(context.extensionUri, {
		joinPath: vscode.Uri.joinPath,
		createClient: (id, name, serverOptions, clientOptions) =>
			new lsp.LanguageClient(
				id,
				name,
				serverOptions as lsp.ServerOptions,
				clientOptions as lsp.LanguageClientOptions,
			),
		activateAutoInsertion,
		transportKindIpc: lsp.TransportKind.ipc,
		supportLabsVersion,
		languageServerProtocol: serverProtocol,
	})
	client = activated.client as lsp.BaseLanguageClient
	return activated.exports satisfies ExportsInfoForLabs
}

export function deactivate(): Thenable<any> | undefined {
	return client?.stop()
}
