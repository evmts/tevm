import { once } from 'node:events'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { BaseError } from '@tevm/errors'
import { type JsonValue, NativeRpcError } from '@tevm/node'
import fc from 'fast-check'
import { custom } from 'viem'
import { expect, expectTypeOf, it } from 'vitest'
import { createJsonRpcFetcher } from './createJsonRpcFetcher.js'

const options = {
	seed: Number(process.env['FUZZ_SEED'] ?? 20261122),
	numRuns: Number(process.env['FUZZ_RUNS'] ?? 300),
}
if (!Number.isSafeInteger(options.seed) || !Number.isSafeInteger(options.numRuns) || options.numRuns < 1)
	throw new Error('FUZZ_SEED must be an integer and FUZZ_RUNS must be a positive integer')

const id = fc.oneof(fc.integer(), fc.string(), fc.constantFrom(null, undefined, 0, ''))
const code = fc.oneof(fc.integer(), fc.constantFrom(-32700, -32602, -32000, 0, 3, 4001, 429))
// Parsing the wire representation also canonicalizes JavaScript's negative zero.
const jsonValue = fc.json({ maxDepth: 3 }).map((json) => JSON.parse(json) as JsonValue)
const data = fc.record({ nested: fc.array(jsonValue, { maxLength: 4 }) })
const rpcError = fc.record(
	{ code, message: fc.string(), data: fc.oneof(data, jsonValue, fc.constant(null)) },
	{ requiredKeys: ['code', 'message'] },
)
const status = fc.constantFrom(200, 400, 429, 500, 502)
const method = 'eth_chainId' as const
const request = (id: string | number | null | undefined) => ({
	jsonrpc: '2.0' as const,
	method,
	params: [] as const,
	...(id === undefined ? {} : { id }),
})

// Load the real client from this checkout. A workspace dependency on its build would
// introduce a cycle through @tevm/server, which already depends on @tevm/jsonrpc.
const httpClientSource = new URL('../../http-client/src/createHttpClient.js', import.meta.url)
const { createHttpClient }: { createHttpClient(options: { url: string }): Parameters<typeof createJsonRpcFetcher>[0] } =
	await import(httpClientSource.href)

async function withHttpPeer(
	check: (
		fetcher: ReturnType<typeof createJsonRpcFetcher>,
		respond: (status: number, body: (id: number) => string) => void,
	) => Promise<void>,
) {
	let reply = (_id: number) => ''
	let statusCode = 200
	let expectedRequests = 0
	let receivedRequests = 0
	const server = createServer(async (req, res) => {
		const chunks: Buffer[] = []
		for await (const chunk of req) chunks.push(chunk)
		const { id } = JSON.parse(Buffer.concat(chunks).toString())
		receivedRequests++
		res.writeHead(statusCode, { 'content-type': 'application/json' }).end(reply(id))
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	try {
		const client = createHttpClient({ url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` })
		await check(createJsonRpcFetcher(client), (status, body) => {
			expectedRequests++
			statusCode = status
			reply = body
		})
		expect(receivedRequests).toBe(expectedRequests)
	} finally {
		await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
	}
}

it('preserves exact provider codes, messages, nested data and request IDs across HTTP statuses', async () => {
	await withHttpPeer(async (fetcher, respond) => {
		await fc.assert(
			fc.asyncProperty(status, id, rpcError, async (status, id, error) => {
				respond(status, (wireId) => JSON.stringify({ jsonrpc: '2.0', id: wireId, error }))
				const response = await fetcher.request(request(id))
				expectTypeOf(response.error?.data).toBeUnknown()
				expect(JSON.parse(JSON.stringify(response))).toEqual({
					jsonrpc: '2.0',
					method,
					...(id === undefined ? {} : { id }),
					error,
				})
			}),
			options,
		)
	})
})

it('returns serializable transport errors for invalid JSON at every HTTP status', async () => {
	await withHttpPeer(async (fetcher, respond) => {
		await fc.assert(
			fc.asyncProperty(
				status,
				id,
				fc.string(),
				fc.constantFrom('truncated', 'trailing', 'html'),
				async (status, id, text, kind) => {
					const body =
						kind === 'truncated'
							? `{"result":${JSON.stringify(text)}`
							: kind === 'trailing'
								? `${JSON.stringify(text)}!`
								: `<html>${text}`
					respond(status, () => body)
					const response = await fetcher.request(request(id))
					expect(JSON.parse(JSON.stringify(response))).toEqual({
						jsonrpc: '2.0',
						method,
						...(id === undefined ? {} : { id }),
						error: { code: -32000, message: expect.stringMatching(/HTTP request failed/i) },
					})
				},
			),
			options,
		)
	})
})

it('round trips successful results and equivalent number and string error codes', async () => {
	await fc.assert(
		fc.asyncProperty(id, rpcError, jsonValue, async (id, error, result) => {
			const base = { jsonrpc: '2.0', method, ...(id === undefined ? {} : { id }) }
			const success = createJsonRpcFetcher(custom({ request: async () => result })({}))
			expect(JSON.parse(JSON.stringify(await success.request(request(id))))).toEqual({ ...base, result })
			for (const code of [error.code, String(error.code)]) {
				const failure = createJsonRpcFetcher({
					request: async () => {
						throw { ...error, code }
					},
				})
				expect(JSON.parse(JSON.stringify(await failure.request(request(id))))).toEqual({ ...base, error })
			}
		}),
		options,
	)
})

class TestError extends BaseError {
	constructor(message: string, cause: unknown, code: number) {
		super(message, { cause }, 'TestError', code)
	}
}

it('serializes bigint and circular diagnostics while retaining ordinary fields and shared siblings', () => {
	fc.assert(
		fc.property(rpcError, fc.bigInt(), fc.boolean(), (envelope, amount, inArray) => {
			const shared = { amount, nested: envelope.data ?? null }
			const graph: Record<string, unknown> = { left: shared, right: shared }
			graph['back'] = inArray ? [graph] : graph
			const expectedShared = { amount: amount.toString(), nested: shared.nested }
			const expectedGraph = {
				left: expectedShared,
				right: expectedShared,
				back: inArray ? ['[Circular]'] : '[Circular]',
			}
			const native = new NativeRpcError(envelope)
			expect(JSON.parse(JSON.stringify(native)).data).toEqual(envelope.data)
			// Application diagnostics can attach JS values after the native JSON envelope is decoded.
			Object.assign(native, { data: graph })
			const errors = [new TestError(envelope.message, graph, envelope.code), native]
			for (const error of errors) {
				error.cause = graph
				expect(error).toBeInstanceOf(BaseError)
				const serialized = JSON.parse(JSON.stringify(error))
				expect(serialized).toMatchObject({
					name: error.name,
					shortMessage: envelope.message,
					code: envelope.code,
					cause: expectedGraph,
				})
				if (error === native) expect(serialized.data).toEqual(expectedGraph)
				expect(error.cause).toBe(graph)
				expect(graph['left']).toBe(graph['right'])
				expect(shared.amount).toBe(amount)
			}
		}),
		options,
	)
})

it('returns the original parse error including an empty message and null data', async () => {
	await withHttpPeer(async (fetcher, respond) => {
		const error = { code: -32700, message: '', data: null }
		respond(200, (id) => JSON.stringify({ jsonrpc: '2.0', id, error }))
		expect(JSON.parse(JSON.stringify(await fetcher.request(request(0))))).toEqual({
			jsonrpc: '2.0',
			method,
			id: 0,
			error,
		})
	})
})

it('retains zero bigint causes and marks a reference back to the error itself', () => {
	const error = new TestError('bad', 0n, -32602)
	expect(error.cause).toBe(0n)
	expect(error.details).toBe('0')
	expect(JSON.parse(JSON.stringify(error)).cause).toBe('0')
	error.cause = error
	expect(JSON.parse(JSON.stringify(error)).cause).toBe('[Circular]')
	const native = new NativeRpcError({ code: -32602, message: 'bad', data: [] })
	Object.assign(native, { data: [0n, native] })
	expect(JSON.parse(JSON.stringify(native)).data).toEqual(['0', '[Circular]'])
})
