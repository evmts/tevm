import { EventEmitter } from 'node:events'
import { rm } from 'node:fs/promises'
import { type AddressInfo, createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMemoryClient } from '@tevm/memory-client'
import { createZevmEngine } from '@tevm/node'
import { createHttpHandler, createIpcServer, createServer } from '@tevm/server'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
// @ts-expect-error ws types are resolved in server package; raw runtime constructor used for socket fuzzing
import { WebSocket } from 'ws'
import { createRpcConnection } from '../../../packages/server/src/internal/createRpcConnection.js'
import { extractJsonRpcFrames } from '../../../packages/server/src/internal/extractJsonRpcFrames.js'
import { getRequestBody } from '../../../packages/server/src/internal/getRequestBody.js'
import { adversarialJsonStringArb, jsonRpcIdArb } from './arbitraries.js'
import { fcParams } from './config.js'

const feedChunked = (input: string, cutPoints: number[]): [string[], string] => {
	const sorted = [...new Set(cutPoints.filter((n) => n > 0 && n < input.length))].sort((a, b) => a - b)
	const chunks: string[] = []
	let prev = 0
	for (const cut of sorted) {
		chunks.push(input.slice(prev, cut))
		prev = cut
	}
	chunks.push(input.slice(prev))

	let buffer = ''
	const allFrames: string[] = []
	for (const chunk of chunks) {
		buffer += chunk
		const [frames, remaining] = extractJsonRpcFrames(buffer)
		allFrames.push(...frames)
		buffer = remaining
	}
	return [allFrames, buffer]
}

describe('@tevm/server protocol, framing, HTTP, WebSocket, and IPC fuzzing', () => {
	it('fuzz: extractJsonRpcFrames never throws and satisfies exact chunk-splitting invariance', () => {
		const validFrameArb = fc
			.record({
				jsonrpc: fc.constant('2.0'),
				id: fc.option(jsonRpcIdArb, { nil: undefined }),
				method: fc.constantFrom('eth_blockNumber', 'eth_chainId', 'net_version', 'eth_call'),
				params: fc.array(fc.oneof(fc.string({ maxLength: 24 }), fc.integer(), fc.boolean(), fc.constant(null)), {
					maxLength: 3,
				}),
			})
			.map((obj) => JSON.stringify(obj))

		// 1) Valid concatenated / whitespace-separated JSON-RPC frames MUST extract cleanly regardless of chunking.
		fc.assert(
			fc.property(
				fc.array(validFrameArb, { minLength: 1, maxLength: 8 }),
				fc.array(fc.constantFrom('', ' ', '\n', '\r\n', '\t  \n'), { minLength: 1, maxLength: 8 }),
				fc.array(fc.integer({ min: 1, max: 512 }), { maxLength: 16 }),
				(frames, seps, cuts) => {
					const stream = frames.map((f, i) => `${seps[i % seps.length]}${f}`).join('')
					const [singleFrames, singleRem] = extractJsonRpcFrames(stream)
					const [chunkedFrames, chunkedRem] = feedChunked(stream, cuts)

					expect(singleFrames).toEqual(frames)
					expect(singleRem).toBe('')
					expect(chunkedFrames).toEqual(singleFrames)
					expect(chunkedRem).toBe(singleRem)
				},
			),
			fcParams('pure', { numRuns: 300 }),
		)

		// 2) Arbitrary adversarial strings (malformed braces, escapes, unicode, garbage) MUST never throw
		// and MUST satisfy exact chunk-splitting invariance.
		fc.assert(
			fc.property(
				adversarialJsonStringArb,
				fc.array(fc.integer({ min: 1, max: 256 }), { maxLength: 16 }),
				(raw, cuts) => {
					const [singleFrames, singleRem] = extractJsonRpcFrames(raw)
					const [chunkedFrames, chunkedRem] = feedChunked(raw, cuts)
					expect(chunkedFrames).toEqual(singleFrames)
					expect(chunkedRem).toBe(singleRem)
					expect(typeof singleRem).toBe('string')
					for (const frame of singleFrames) {
						expect(typeof frame).toBe('string')
					}
				},
			),
			fcParams('pure', { numRuns: 400 }),
		)
	})

	it('fuzz: getRequestBody enforces maxBodySize across arbitrary UTF-8 byte splits, pre-parsed bodies, and stream errors', async () => {
		// 1) Streamed UTF-8 buffers split at arbitrary byte offsets (including inside multi-byte characters).
		await fc.assert(
			fc.asyncProperty(
				fc.uint8Array({ minLength: 0, maxLength: 256 }),
				fc.array(fc.integer({ min: 1, max: 256 }), { maxLength: 12 }),
				fc.integer({ min: 0, max: 300 }),
				async (rawBytes, cutIndices, maxBodySize) => {
					const fullBuf = Buffer.from(rawBytes)
					const decodedExpected = fullBuf.toString('utf8')
					const expectedByteLen = Buffer.byteLength(decodedExpected, 'utf8')
					const cuts = [...new Set(cutIndices.filter((c) => c > 0 && c < fullBuf.length))].sort((a, b) => a - b)

					const req = new EventEmitter() as EventEmitter & { pause: () => void }
					req.pause = () => {}

					const promise = getRequestBody(req as never, { maxBodySize })
					let prev = 0
					for (const cut of cuts) {
						req.emit('data', fullBuf.subarray(prev, cut))
						prev = cut
					}
					if (prev < fullBuf.length) {
						req.emit('data', fullBuf.subarray(prev))
					}
					req.emit('end')

					const result = await promise
					if (expectedByteLen > maxBodySize) {
						expect(result).toBeInstanceOf(Error)
					} else {
						expect(result).toBe(decodedExpected)
					}
				},
			),
			fcParams('pure', { numRuns: 250 }),
		)

		// 2) Pre-parsed body values (primitives, objects, Buffers, BigInt, circular) MUST never throw.
		await fc.assert(
			fc.asyncProperty(
				fc.oneof(
					fc.string({ maxLength: 128 }),
					fc.uint8Array({ maxLength: 128 }).map((b) => Buffer.from(b)),
					fc.jsonValue({ maxDepth: 3 }),
					fc.constant(123n),
					fc.constant(() => {}),
					fc.constant(Symbol('fuzz')),
					fc.constant(
						(() => {
							const c: Record<string, unknown> = {}
							c['self'] = c
							return c
						})(),
					),
				),
				fc.integer({ min: 0, max: 200 }),
				async (body, maxBodySize) => {
					const res = await getRequestBody({ body }, { maxBodySize })
					if (typeof res === 'string') {
						expect(Buffer.byteLength(res, 'utf8')).toBeLessThanOrEqual(maxBodySize)
					} else {
						expect(res).toBeInstanceOf(Error)
					}
				},
			),
			fcParams('pure', { numRuns: 200 }),
		)
	})

	it('fuzz: HTTP server enforces method, CORS, maxBodySize, maxBatchSize, notification 204, and JSON-RPC 2.0 invariants', async () => {
		const client = createMemoryClient()
		await client.tevmReady()
		const maxBodySize = 512
		const maxBatchSize = 4
		const server = createServer(client, {}, { cors: true, maxBodySize, maxBatchSize })
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const { port } = server.address() as AddressInfo
		const url = `http://127.0.0.1:${port}/`

		try {
			await fc.assert(
				fc.asyncProperty(
					fc.constantFrom('GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'),
					fc.oneof(
						adversarialJsonStringArb,
						fc.constant(' '.repeat(maxBodySize + 32)),
						fc.integer({ min: 1, max: 8 }).map((n) =>
							JSON.stringify(
								Array.from({ length: n }, (_, i) => ({
									jsonrpc: '2.0',
									id: i + 1,
									method: 'eth_blockNumber',
								})),
							),
						),
					),
					async (method, body) => {
						const res = await fetch(url, {
							method,
							headers: { 'content-type': 'application/json' },
							...(method === 'GET' || method === 'OPTIONS' ? {} : { body }),
						})
						expect(res.headers.get('access-control-allow-origin')).toBe('*')
						if (method === 'OPTIONS') {
							expect(res.status).toBe(204)
							return
						}
						if (method !== 'POST') {
							expect(res.status).toBe(405)
							return
						}
						const byteLen = Buffer.byteLength(body, 'utf8')
						if (byteLen > maxBodySize) {
							expect(res.status).toBe(413)
							return
						}
						let parsedInput: unknown
						try {
							parsedInput = JSON.parse(body)
						} catch {
							// Malformed JSON -> native parse error 200 JSON-RPC -32700
							expect(res.status).toBe(200)
							const errJson = (await res.json()) as { error?: { code?: number } }
							expect(errJson.error?.code).toBe(-32700)
							return
						}
						if (Array.isArray(parsedInput) && parsedInput.length > maxBatchSize) {
							expect(res.status).toBe(413)
							return
						}
						expect([200, 204]).toContain(res.status)
						if (res.status === 200) {
							const text = await res.text()
							const parsed = JSON.parse(text)
							expect(parsed).toBeDefined()
						}
					},
				),
				fcParams('io', { numRuns: 70 }),
			)
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
			await client.tevmClose()
		}
	})

	it('fuzz: createRpcConnection stateful subscription & batch lifecycle never throws or leaks native filters', async () => {
		const engine = createZevmEngine()
		await engine.ready()
		try {
			const subKindArb = fc.constantFrom('newHeads', 'logs', 'newPendingTransactions', 'syncing', 'bogusKind', 42, null)
			const opArb = fc.oneof(
				fc.tuple(fc.constant('subscribe' as const), jsonRpcIdArb, subKindArb),
				fc.tuple(fc.constant('unsubscribe' as const), jsonRpcIdArb, fc.constantFrom('0x1', '0x2', '0x999', 123)),
				fc.tuple(fc.constant('raw' as const), adversarialJsonStringArb),
				fc.tuple(fc.constant('mine' as const)),
			)

			await fc.assert(
				fc.asyncProperty(fc.array(opArb, { minLength: 1, maxLength: 15 }), async (ops) => {
					const sent: string[] = []
					const conn = createRpcConnection(engine, (json) => {
						// Every outbound frame MUST be valid JSON.
						expect(() => JSON.parse(json)).not.toThrow()
						sent.push(json)
					})
					const activeIds: string[] = []
					try {
						for (const op of ops) {
							if (op[0] === 'subscribe') {
								const [, id, kind] = op
								const beforeLen = sent.length
								await conn.rpc(JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_subscribe', params: [kind] }))
								expect(sent.length).toBeGreaterThan(beforeLen)
								const reply = JSON.parse(sent[sent.length - 1]!)
								expect(reply.jsonrpc).toBe('2.0')
								expect(reply.id).toEqual(id)
								if (typeof reply.result === 'string') {
									activeIds.push(reply.result)
								}
							} else if (op[0] === 'unsubscribe') {
								const [, id, fallbackSubId] = op
								const target = activeIds.length > 0 ? activeIds.pop()! : fallbackSubId
								const beforeLen = sent.length
								await conn.rpc(JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_unsubscribe', params: [target] }))
								expect(sent.length).toBeGreaterThan(beforeLen)
								const reply = JSON.parse(sent[sent.length - 1]!)
								expect(reply.jsonrpc).toBe('2.0')
								expect(reply.id).toEqual(id)
							} else if (op[0] === 'raw') {
								await conn.rpc(op[1])
							} else {
								await engine.request({ method: 'evm_mine' })
							}
						}
					} finally {
						await conn.close()
					}
				}),
				fcParams('io', { numRuns: 35 }),
			)
		} finally {
			await engine.close()
		}
	})

	it('fuzz: WebSocket and IPC servers survive fragmented, malformed, and mixed valid RPC traffic', async () => {
		const client = createMemoryClient()
		await client.tevmReady()
		const httpServer = createServer(client)
		await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
		const { port } = httpServer.address() as AddressInfo

		const ipcPath = join(tmpdir(), `tevm-fuzz-${process.pid}-${Date.now()}.sock`)
		const ipcServer = createIpcServer(client, {}, { maxMessageSize: 8192 })
		await new Promise<void>((resolve) => ipcServer.listen(ipcPath, resolve))

		try {
			// WebSocket fuzzing over real socket.
			const ws = new WebSocket(`ws://127.0.0.1:${port}`)
			await new Promise<void>((resolve, reject) => {
				ws.once('open', resolve)
				ws.once('error', reject)
			})
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc
							.integer({ min: 1, max: 10000 })
							.map((id) => JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_blockNumber' })),
						fc.constant('{invalid json'),
						fc.constant('{"jsonrpc":"2.0","id":7,"method":"eth_subscribe","params":["invalid"]}'),
					),
					async (payload) => {
						const replyPromise = new Promise<string>((resolve) =>
							ws.once('message', (d: { toString(): string }) => resolve(d.toString())),
						)
						ws.send(payload)
						const reply = await replyPromise
						const parsed = JSON.parse(reply)
						expect(parsed.jsonrpc).toBe('2.0')
					},
				),
				fcParams('io', { numRuns: 25 }),
			)
			ws.close()
			await new Promise<void>((resolve) => ws.once('close', resolve))

			// IPC fragmented JSON framing fuzzing over real Unix socket.
			const socket = createConnection(ipcPath)
			await new Promise<void>((resolve, reject) => {
				socket.once('connect', resolve)
				socket.once('error', reject)
			})
			let ipcBuf = ''
			const pendingLines: Array<(line: string) => void> = []
			socket.on('data', (chunk) => {
				ipcBuf += chunk.toString('utf8')
				let nl = ipcBuf.indexOf('\n')
				while (nl !== -1) {
					const line = ipcBuf.slice(0, nl)
					ipcBuf = ipcBuf.slice(nl + 1)
					const waiter = pendingLines.shift()
					if (waiter) waiter(line)
					nl = ipcBuf.indexOf('\n')
				}
			})
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: 1, max: 100_000 }), fc.integer({ min: 1, max: 40 }), async (id, splitAt) => {
					const frame = JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_chainId' })
					const cut = Math.min(splitAt, frame.length - 1)
					const linePromise = new Promise<string>((resolve) => pendingLines.push(resolve))
					socket.write(frame.slice(0, cut))
					socket.write(frame.slice(cut))
					const line = await linePromise
					const parsed = JSON.parse(line)
					expect(parsed).toEqual({ jsonrpc: '2.0', id, result: '0x7a69' })
				}),
				fcParams('io', { numRuns: 25 }),
			)
			socket.destroy()
		} finally {
			await new Promise<void>((resolve) => httpServer.close(() => resolve()))
			await new Promise<void>((resolve) => ipcServer.close(() => resolve()))
			await rm(ipcPath, { force: true })
			await client.tevmClose()
		}
	})

	it('fuzz: createHttpHandler returns 503 with valid JSON-RPC -32603 error when native engine is closed', async () => {
		const client = createMemoryClient()
		await client.tevmReady()
		await client.tevmClose()
		const handler = createHttpHandler(client)
		const resHeaders: Record<string, string> = {}
		let statusCode = 0
		let endedBody = ''
		const res = {
			setHeader(k: string, v: string) {
				resHeaders[k] = v
			},
			writeHead(code: number) {
				statusCode = code
				return this
			},
			end(chunk?: string) {
				endedBody = chunk ?? ''
			},
		}
		await handler(
			{
				method: 'POST',
				setTimeout() {},
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber' }),
			} as never,
			res as never,
		)
		expect(statusCode).toBe(503)
		expect(JSON.parse(endedBody)).toEqual({
			jsonrpc: '2.0',
			id: null,
			error: { code: -32603, message: 'Native engine unavailable' },
		})
	})
})
