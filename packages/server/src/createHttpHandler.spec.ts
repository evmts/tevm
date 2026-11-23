import { PassThrough } from 'node:stream'
import { expect, it } from 'vitest'
import type { Client } from './Client.js'
import { createHttpHandler } from './createHttpHandler.js'

const client = {
	transport: { tevm: { rpc: async (json: string) => `{"jsonrpc":"2.0","id":${JSON.parse(json).id},"result":"0x1"}` } },
} as unknown as Client

/** A response double that records what the handler wrote. */
const response = () => {
	const res = {
		status: 0,
		body: undefined as string | undefined,
		setHeader: () => res,
		writeHead: (status: number) => {
			res.status = status
			return res
		},
		end: (body?: string) => {
			res.body = body
			return res
		},
	}
	return res
}

it('serves a framework request object that has a parsed body and no setTimeout or destroy', async () => {
	// Express and Next.js test doubles are plain objects, not sockets-backed IncomingMessages.
	const res = response()
	await createHttpHandler(client)(
		{ method: 'POST', body: { jsonrpc: '2.0', id: 7, method: 'eth_chainId' } } as never,
		res as never,
	)
	expect([res.status, res.body]).toEqual([200, '{"jsonrpc":"2.0","id":7,"result":"0x1"}'])
})

it('still arms the request timeout on a real request stream', async () => {
	const req = Object.assign(new PassThrough(), {
		method: 'POST',
		timeouts: [] as number[],
		setTimeout(ms: number) {
			req.timeouts.push(ms)
			return req
		},
	})
	const res = response()
	const handled = createHttpHandler(client, { requestTimeout: 1234 })(req as never, res as never)
	req.end('{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}')
	await handled
	expect(req.timeouts).toEqual([1234])
	expect(res.status).toBe(200)
})

it('answers 500 instead of hanging when the request stream was already consumed', async () => {
	const req = Object.assign(new PassThrough(), { method: 'POST' })
	req.end('{}')
	for await (const _chunk of req) {
		// Discard.
	}
	const res = response()
	await createHttpHandler(client)(req as never, res as never)
	expect(res.status).toBe(500)
})
