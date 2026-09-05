import { createZevmEngine } from '@tevm/node'
import { expect, it } from 'vitest'
import { createRpcConnection } from './createRpcConnection.js'

it('finishes subscription cleanup when the native engine has already closed', async () => {
	const engine = createZevmEngine()
	const responses: unknown[] = []
	const connection = createRpcConnection(engine, (json) => responses.push(JSON.parse(json)))
	try {
		await connection.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['logs'] }))
		expect(responses).toEqual([{ jsonrpc: '2.0', id: 1, result: '0x1' }])
		await engine.close()
		await expect(connection.close()).resolves.toBeUndefined()
		await expect(connection.close()).resolves.toBeUndefined()
	} finally {
		await connection.close()
		await engine.close()
	}
})
