import { describe, expect, it, vi } from 'vitest'
import { activateExtension } from './activateExtension.js'

describe('VS Code extension activation', () => {
	it('starts the TEVM language client with the shipped server and language selectors', async () => {
		const start = vi.fn(async () => undefined)
		const stop = vi.fn(async () => undefined)
		const createClient = vi.fn(() => ({ start, stop }))
		const activateAutoInsertion = vi.fn()
		const result = await activateExtension(
			{ fsPath: '/extension' },
			{
				joinPath: (base, ...segments) => ({ fsPath: [base.fsPath, ...segments].join('/') }),
				createClient,
				activateAutoInsertion,
				transportKindIpc: 'ipc',
				supportLabsVersion: 1,
				languageServerProtocol: { protocol: true },
			},
		)

		expect(start).toHaveBeenCalledOnce()
		expect(createClient).toHaveBeenCalledWith(
			'tevm-language-server',
			'Tevm Language Server',
			expect.objectContaining({
				run: expect.objectContaining({ module: '/extension/dist/server.js', transport: 'ipc' }),
			}),
			{
				documentSelector: [
					{ language: 'solidity' },
					{ language: 'typescript' },
					{ language: 'javascript' },
				],
				initializationOptions: {},
			},
		)
		const selector = activateAutoInsertion.mock.calls[0]?.[1]
		expect(selector({ languageId: 'solidity' })).toBe(true)
		expect(selector({ languageId: 'rust' })).toBe(false)
		expect(result.exports.volarLabs.languageClients).toEqual([result.client])
		await result.client.stop()
		expect(stop).toHaveBeenCalledOnce()
	})
})
