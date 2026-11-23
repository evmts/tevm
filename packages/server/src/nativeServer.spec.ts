import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer as createHttpServer, request as httpRequest } from 'node:http'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { createMemoryClient } from '@tevm/memory-client'
import { afterEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { createHttpHandler } from './createHttpHandler.js'
import { createIpcServer } from './createIpcServer.js'
import { createServer } from './createServer.js'

const cleanups: (() => Promise<unknown>)[] = []
afterEach(async () => {
	for (const close of cleanups.splice(0).reverse()) await close()
})
const start = async (options: Parameters<typeof createServer>[2] = {}) => {
	const client = createMemoryClient()
	cleanups.push(() => client.tevmClose())
	const server = createServer(client, {}, options)
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	cleanups.push(
		() => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
	)
	const address = server.address() as { port: number }
	return { client, url: `http://127.0.0.1:${address.port}` }
}
const request = (method: string, params: unknown[] = [], id: number | string = 1) => ({
	jsonrpc: '2.0',
	id,
	method,
	params,
})

describe('native server transports', () => {
	it.each([
		undefined,
		0,
		1,
		Infinity,
		Number.MAX_SAFE_INTEGER + 1,
	])('honors a subscription cap of %s on both transports', async (maxSubscriptions) => {
		const options = maxSubscriptions === undefined ? {} : { maxSubscriptions }
		const limit = maxSubscriptions ?? 256
		const { client, url } = await start(options)
		const requests = Array.from({ length: 257 }, (_, i) => request('eth_subscribe', ['syncing'], i + 1))
		const batch = JSON.stringify(requests)
		const expected = requests.map(({ id }, i) => ({
			jsonrpc: '2.0',
			id,
			...(i < limit
				? { result: `0x${(i + 1).toString(16)}` }
				: { error: { code: -32005, message: `Subscription limit exceeded: at most ${limit} per connection` } }),
		}))
		const ws = new WebSocket(url.replace('http:', 'ws:'))
		try {
			await once(ws, 'open')
			const response = once(ws, 'message')
			ws.send(batch)
			expect(JSON.parse((await response)[0].toString())).toEqual(expected)
		} finally {
			ws.terminate()
		}

		const server = createIpcServer(client, {}, options)
		server.listen(0, '127.0.0.1')
		await once(server, 'listening')
		const socket = createConnection({ host: '127.0.0.1', port: (server.address() as { port: number }).port })
		try {
			const response = once(createInterface({ input: socket }), 'line')
			socket.write(batch)
			expect(JSON.parse((await response)[0])).toEqual(expected)
		} finally {
			socket.destroy()
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	})

	it.each([
		-1,
		0.5,
		NaN,
		-Infinity,
		null as never,
		'2' as never,
	])('rejects maxSubscriptions %s before accepting connections', (maxSubscriptions) => {
		const client = createMemoryClient()
		cleanups.push(() => client.tevmClose())
		expect(() => createServer(client, {}, { maxSubscriptions })).toThrow(RangeError)
		expect(() => createIpcServer(client, {}, { maxSubscriptions })).toThrow(RangeError)
	})

	it('serves exact HTTP quantities, errors, data, nulls, batches and notifications', async () => {
		const { url } = await start({ cors: true, maxBodySize: 4096, maxBatchSize: 2 })
		const post = (body: unknown) =>
			fetch(url, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
		const response = await post(request('eth_chainId'))
		expect(response.status).toBe(200)
		expect(response.headers.get('access-control-allow-origin')).toBe('*')
		expect(await response.json()).toEqual({ jsonrpc: '2.0', id: 1, result: '0x7a69' })
		const batch = await (
			await post([
				request('eth_getCode', [`0x${'12'.repeat(20)}`, 'latest']),
				request('eth_getTransactionByHash', [`0x${'00'.repeat(32)}`], 2),
			])
		).json()
		expect(batch).toEqual([
			{ jsonrpc: '2.0', id: 1, result: '0x' },
			{ jsonrpc: '2.0', id: 2, result: null },
		])
		expect(JSON.parse(JSON.stringify(batch))).toEqual(batch)
		expect(await (await post(request('missing_method'))).json()).toEqual({
			jsonrpc: '2.0',
			id: 1,
			error: { code: -32601, message: 'Method not found' },
		})
		expect(((await (await post('{')).json()) as { error: { code: number } }).error.code).toBe(-32700)
		expect(((await (await post('[]')).json()) as { error: { code: number } }).error.code).toBe(-32600)
		expect((await post({ jsonrpc: '2.0', method: 'eth_chainId' })).status).toBe(204)
		expect((await post([request('eth_chainId'), request('eth_chainId'), request('eth_chainId')])).status).toBe(413)
		expect((await post(' '.repeat(4097))).status).toBe(413)
		expect((await fetch(url)).status).toBe(405)
		expect((await fetch(url, { method: 'OPTIONS' })).status).toBe(204)
	})
	it('closes stalled request bodies at the configured timeout', async () => {
		const { url } = await start({ requestTimeout: 30 })
		const req = httpRequest(url, { method: 'POST', headers: { 'content-length': '100' } })
		const failed = new Promise<Error>((resolve) => req.once('error', resolve))
		req.write('{')
		expect((await failed).message).toContain('socket hang up')
	})
	it('reports unavailable engines without exposing implementation errors', async () => {
		const { client, url } = await start()
		await client.tevmClose()
		const response = await fetch(url, { method: 'POST', body: JSON.stringify(request('eth_chainId')) })
		expect(response.status).toBe(503)
		expect(await response.json()).toEqual({
			jsonrpc: '2.0',
			id: null,
			error: { code: -32603, message: 'Native engine unavailable' },
		})
	})
	it('streams native block filters over WebSocket and scopes subscriptions to connections', async () => {
		const { client, url } = await start()
		const socket = new WebSocket(url.replace('http:', 'ws:'))
		await once(socket, 'open')
		cleanups.push(async () => {
			const closed = once(socket, 'close')
			socket.close()
			await closed
		})
		const rpc = async (value: unknown) => {
			const response = once(socket, 'message')
			socket.send(typeof value === 'string' ? value : JSON.stringify(value))
			return JSON.parse((await response)[0].toString())
		}
		expect((await rpc(request('eth_chainId'))).result).toBe('0x7a69')
		expect((await rpc('{')).error.code).toBe(-32700)
		expect((await rpc(request('eth_subscribe', ['invalid']))).error.code).toBe(-32602)
		const subscription = (await rpc(request('eth_subscribe', ['newHeads']))).result
		const notification = once(socket, 'message')
		await client.tevmMine()
		const event = JSON.parse((await notification)[0].toString())
		expect(event).toMatchObject({
			jsonrpc: '2.0',
			method: 'eth_subscription',
			params: { subscription, result: { number: '0x1' } },
		})
		expect((await rpc(request('eth_unsubscribe', [subscription]))).result).toBe(true)
		expect((await rpc(request('eth_unsubscribe', [subscription]))).result).toBe(false)
		expect((await rpc(request('eth_unsubscribe', [1]))).error.code).toBe(-32602)
		expect((await rpc({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe' })).error.code).toBe(-32602)
		const syncing = (await rpc(request('eth_subscribe', ['syncing']))).result
		expect((await rpc(request('eth_unsubscribe', [syncing]))).result).toBe(true)
		expect((await rpc(request('eth_subscribe', ['logs', { address: 'invalid' }]))).error.code).toBe(-32602)
		// Keep filters alive through disconnect to exercise native cleanup.
		expect((await rpc(request('eth_subscribe', ['logs']))).result).toMatch(/^0x/)
		expect((await rpc(request('eth_subscribe', ['newPendingTransactions']))).result).toMatch(/^0x/)

		expect(await rpc([request('eth_chainId', [], 2), { jsonrpc: '2.0', method: 'eth_chainId' }])).toEqual([
			{ jsonrpc: '2.0', id: 2, result: '0x7a69' },
		])
	})
	it('rejects oversized WebSocket frames without terminating the server', async () => {
		const { url } = await start()
		const socket = new WebSocket(url.replace('http:', 'ws:'))
		await once(socket, 'open')
		const closed = once(socket, 'close')
		socket.send(' '.repeat(1024 * 1024 + 1))
		expect((await closed)[0]).toBe(1009)
		const response = await fetch(url, { method: 'POST', body: JSON.stringify(request('eth_chainId')) })
		expect(await response.json()).toEqual({ jsonrpc: '2.0', id: 1, result: '0x7a69' })
	})
	it('handles a peer resetting the stream server connection', async () => {
		const client = createMemoryClient()
		// net.Server supports TCP as well as Unix sockets. TCP exposes a real
		// peer reset deterministically, exercising the shared stream error path.
		const server = createIpcServer(client)
		server.listen(0, '127.0.0.1')
		await once(server, 'listening')
		const accepted = once(server, 'connection')
		const socket = createConnection({ host: '127.0.0.1', port: (server.address() as { port: number }).port })
		try {
			const [peer] = await accepted
			const received = once(socket, 'data')
			socket.write(JSON.stringify(request('eth_chainId')))
			await received
			const failed = once(peer, 'error')
			socket.resetAndDestroy()
			expect((await failed)[0].code).toBe('ECONNRESET')
		} finally {
			socket.destroy()
			await new Promise<void>((resolve) => server.close(() => resolve()))
			await client.tevmClose()
		}
	})
	it('closes WebSocket requests cleanly after the native engine shuts down', async () => {
		const { client, url } = await start()
		const socket = new WebSocket(url.replace('http:', 'ws:'))
		await once(socket, 'open')
		await client.tevmClose()
		const closed = once(socket, 'close')
		socket.send(JSON.stringify(request('eth_chainId')))
		expect((await closed)[0]).toBe(1011)
	})
	it('closes IPC requests cleanly after the native engine shuts down', async () => {
		const client = createMemoryClient()
		const directory = await mkdtemp(join(tmpdir(), 'tevm-unavailable-'))
		const path = join(directory, 'rpc.sock')
		const server = createIpcServer(client)
		server.listen(path)
		await once(server, 'listening')
		try {
			const socket = createConnection(path)
			await once(socket, 'connect')
			await client.tevmClose()
			const closed = once(socket, 'close')
			socket.write(JSON.stringify(request('eth_chainId')))
			await closed
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
			await client.tevmClose()
			await rm(directory, { recursive: true, force: true })
		}
	})
	it('accepts split and concatenated IPC frames', async () => {
		const client = createMemoryClient()
		cleanups.push(() => client.tevmClose())
		const directory = await mkdtemp(join(tmpdir(), 'tevm-native-'))
		cleanups.push(() => rm(directory, { recursive: true, force: true }))
		const path = join(directory, 'rpc.sock')
		const server = createIpcServer(client, {}, { maxMessageSize: 110 })
		server.listen(path)
		await once(server, 'listening')
		cleanups.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
		const firstChunkRead = new Promise<void>((resolve) => {
			server.once('connection', (peer) => peer.once('data', () => resolve()))
		})
		const socket = createConnection(path)
		socket.setEncoding('utf8')
		await once(socket, 'connect')
		cleanups.push(async () => {
			if (socket.destroyed) return
			const closed = once(socket, 'close')
			socket.destroy()
			await closed
		})
		const responses: unknown[] = []
		let text = ''
		const received = new Promise<void>((resolve) =>
			socket.on('data', (bytes) => {
				text += bytes.toString()
				while (text.includes('\n')) {
					const split = text.indexOf('\n')
					responses.push(JSON.parse(text.slice(0, split)))
					text = text.slice(split + 1)
				}
				if (responses.length === 2) resolve()
			}),
		)
		const id = '🦊'
		const payload = Buffer.from(
			[request('eth_chainId', [], id), request('eth_blockNumber', [], 2)]
				.map((frame) => JSON.stringify(frame))
				.join('\n'),
		)
		const split = payload.indexOf(id) + 1
		socket.write(payload.subarray(0, split))
		// Wait for the IPC decoder to consume the first byte before sending the rest.
		await firstChunkRead
		socket.write(payload.subarray(split))
		await received
		expect(responses).toEqual([
			{ jsonrpc: '2.0', id, result: '0x7a69' },
			{ jsonrpc: '2.0', id: 2, result: '0x0' },
		])
		const closed = once(socket, 'close')
		socket.write(`{${' '.repeat(110)}`)
		await closed
	})
})

it('forwards the WebSocket upgrade path and payload limit and closes idle clients on shutdown', async () => {
	const client = createMemoryClient()
	const server = createServer(client, {}, { path: '/rpc', maxPayload: 64 })
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	const url = `ws://127.0.0.1:${(server.address() as { port: number }).port}`
	const socket = new WebSocket(`${url}/rpc`)
	try {
		await once(socket, 'open')
		await expect(once(new WebSocket(url), 'open')).rejects.toThrow(/400/)
		const oversized = new WebSocket(`${url}/rpc`)
		await once(oversized, 'open')
		const rejected = once(oversized, 'close')
		oversized.send('a'.repeat(65))
		expect((await rejected)[0]).toBe(1009)
		const disconnected = once(socket, 'close')
		const stopped = new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
		await Promise.all([disconnected, stopped])
	} finally {
		socket.terminate()
		if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
		await client.tevmClose()
	}
})

it('returns distinct HTTP statuses for oversize, invalid framework data and stream failures', async () => {
	const client = createMemoryClient()
	const handler = createHttpHandler(client, { maxBodySize: 64 })
	const server = createHttpServer((req, res) => {
		if (req.url === '/invalid') Object.assign(req, { body: 1n })
		void handler(req, res)
		if (req.url === '/broken') req.emit('error', new Error('body reader failed'))
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	try {
		const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`
		for (const [path, expected] of [
			['/oversized', 413],
			['/invalid', 400],
			['/broken', 500],
		] as const)
			expect((await fetch(url + path, { method: 'POST', body: ' '.repeat(65) })).status).toBe(expected)
	} finally {
		await new Promise<void>((resolve) => server.close(() => resolve()))
		await client.tevmClose()
	}
})
