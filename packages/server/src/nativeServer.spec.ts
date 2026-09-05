import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { request as httpRequest } from 'node:http'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMemoryClient } from '@tevm/memory-client'
import { afterEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
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
				request('eth_getCode', ['0x' + '12'.repeat(20), 'latest']),
				request('eth_getTransactionByHash', ['0x' + '00'.repeat(32)], 2),
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
		const syncEvent = JSON.parse((await once(socket, 'message'))[0].toString())
		expect(syncEvent).toEqual({
			jsonrpc: '2.0',
			method: 'eth_subscription',
			params: { subscription: syncing, result: false },
		})
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
		const server = createIpcServer(client)
		server.listen(path)
		await once(server, 'listening')
		cleanups.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
		const socket = createConnection(path)
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
		const payload = JSON.stringify(request('eth_chainId')) + JSON.stringify(request('eth_blockNumber', [], 2))
		socket.write(payload.slice(0, 10))
		socket.write(payload.slice(10))
		await received
		expect(responses).toEqual([
			{ jsonrpc: '2.0', id: 1, result: '0x7a69' },
			{ jsonrpc: '2.0', id: 2, result: '0x0' },
		])
		const closed = once(socket, 'close')
		socket.write('{' + ' '.repeat(1024 * 1024))
		await closed
	})
})
