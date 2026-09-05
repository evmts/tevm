import { once } from 'node:events'
import { createServer } from 'node:http'
import { createMemoryClient } from '@tevm/memory-client'
import { afterEach, describe, expect, it } from 'vitest'
import { createExpressMiddleware } from './createExpressMiddleware.js'

const close: (() => Promise<unknown>)[] = []
afterEach(async () => {
	for (const cleanup of close.splice(0).reverse()) await cleanup()
})
describe('createExpressMiddleware native RPC', () => {
	it.each([
		['chain ID', '{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}', { jsonrpc: '2.0', id: 1, result: '0x7a69' }],
		['invalid JSON', '{', { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }],
		[
			'unknown method',
			'{"jsonrpc":"2.0","id":1,"method":"invalid_method"}',
			{ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'Method not found' } },
		],
	])('handles %s', async (_name, body, expected) => {
		const client = createMemoryClient()
		close.push(() => client.tevmClose())
		const handler = createExpressMiddleware(client)
		const server = createServer((req, res) => {
			void handler(req as never, res as never, (() => {}) as never)
		})
		server.listen(0, '127.0.0.1')
		await once(server, 'listening')
		close.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
		const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}`, {
			method: 'POST',
			body: body as string,
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toContain('application/json')
		expect(await response.json()).toEqual(expected)
	})
})
