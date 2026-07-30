import type { AddressInfo } from 'node:net'
import { createMemoryClient } from '@tevm/memory-client'
import { createPublicClient, webSocket } from 'viem'
import { describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { createServer } from './createServer.js'

describe('createWebSocketServer', () => {
	it('serves JSON-RPC and delivers newHeads subscriptions through viem webSocket()', async () => {
		const tevm = createMemoryClient({ miningConfig: { type: 'manual' } })
		const server = createServer(tevm)
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const port = (server.address() as AddressInfo).port
		const client = createPublicClient({
			transport: webSocket(`ws://127.0.0.1:${port}`),
		})

		try {
			expect(await client.getChainId()).toBe(900)

			let resolveNotification!: (data: any) => void
			let rejectNotification!: (error: Error) => void
			const notification = new Promise<any>((resolve, reject) => {
				const timeout = setTimeout(() => reject(new Error('Timed out waiting for newHeads notification')), 5_000)
				resolveNotification = (data) => {
					clearTimeout(timeout)
					resolve(data)
				}
				rejectNotification = (error) => {
					clearTimeout(timeout)
					reject(error)
				}
			})
			const subscription = await client.transport.subscribe({
				params: ['newHeads'],
				onData: resolveNotification,
				onError: rejectNotification,
			})
			await tevm.mine({ blocks: 1 })

			const data = await notification
			expect(data.result.number).toBe('0x1')
			await subscription.unsubscribe()
			await expect.poll(() => tevm.transport.tevm.getFilters().size).toBe(0)
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	}, 15_000)

	it('does not accumulate filter buffers for long-lived subscriptions', async () => {
		const tevm = createMemoryClient({ miningConfig: { type: 'manual' } })
		const server = createServer(tevm)
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const port = (server.address() as AddressInfo).port
		const client = createPublicClient({
			transport: webSocket(`ws://127.0.0.1:${port}`),
		})

		try {
			const seen: Array<string> = []
			await client.transport.subscribe({
				params: ['newHeads'],
				onData: (data: any) => seen.push(data.result.number),
			})
			await tevm.mine({ blocks: 3 })
			await expect.poll(() => seen.length).toBe(3)

			// every block was delivered over the socket, none are left buffered in the node
			const [filter] = [...tevm.transport.tevm.getFilters().values()]
			expect(filter?.blocks).toEqual([])
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	}, 15_000)

	it('removes subscriptions when a WebSocket connection closes', async () => {
		const tevm = createMemoryClient({ miningConfig: { type: 'manual' } })
		const server = createServer(tevm)
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const port = (server.address() as AddressInfo).port
		const client = createPublicClient({
			transport: webSocket(`ws://127.0.0.1:${port}`),
		})

		try {
			await client.transport.subscribe({
				params: ['newHeads'],
				onData() {},
			})
			expect(tevm.transport.tevm.getFilters().size).toBe(1)

			const socket = await client.transport.getSocket()
			socket.close()
			await expect.poll(() => tevm.transport.tevm.getFilters().size).toBe(0)
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	})

	it('pushes logs, pending transactions, and syncing notifications', async () => {
		const tevm = createMemoryClient({ miningConfig: { type: 'manual' } })
		const server = createServer(tevm)
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const port = (server.address() as AddressInfo).port
		const client = createPublicClient({
			transport: webSocket(`ws://127.0.0.1:${port}`),
		})
		const address = '0x0000000000000000000000000000000000001000'
		const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
		const topic = `0x${'12'.repeat(32)}` as const

		try {
			await tevm.tevmSetAccount({ address: sender, balance: 10n ** 18n })
			await tevm.tevmSetAccount({
				address,
				deployedBytecode: `0x6112346000527f${topic.slice(2)}6002601ea100`,
			})

			let resolveLog!: (data: any) => void
			let resolveUnfilteredLog!: (data: any) => void
			let resolveArrayFilterLog!: (data: any) => void
			let resolvePending!: (data: any) => void
			const logNotification = new Promise<any>((resolve) => {
				resolveLog = resolve
			})
			const unfilteredLogNotification = new Promise<any>((resolve) => {
				resolveUnfilteredLog = resolve
			})
			const arrayFilterLogNotification = new Promise<any>((resolve) => {
				resolveArrayFilterLog = resolve
			})
			const pendingNotification = new Promise<any>((resolve) => {
				resolvePending = resolve
			})
			const logSubscription = await client.transport.subscribe({
				params: ['logs', { address, topics: [topic] }],
				onData: resolveLog,
			})
			const unfilteredLogSubscription = await client.transport.subscribe({
				params: ['logs', {}],
				onData: resolveUnfilteredLog,
			})
			const arrayFilterLogSubscription = await client.transport.subscribe({
				params: [
					'logs',
					{
						address: ['0x0000000000000000000000000000000000002000', address],
						topics: [[`0x${'00'.repeat(32)}`, topic], null],
					},
				],
				onData: resolveArrayFilterLog,
			})
			const pendingSubscription = await client.transport.subscribe({
				params: ['newPendingTransactions'],
				onData: resolvePending,
			})
			const transaction = await tevm.tevmCall({
				from: sender,
				to: address,
				addToMempool: true,
			})
			expect((await pendingNotification).result).toBe(transaction.txHash)
			await tevm.mine({ blocks: 1 })

			const log = (await logNotification).result
			expect(log).toMatchObject({
				address,
				data: '0x1234',
				blockNumber: '0x1',
				transactionHash: transaction.txHash,
				transactionIndex: '0x0',
				logIndex: '0x0',
			})
			expect((await unfilteredLogNotification).result).toMatchObject({
				address,
				data: '0x1234',
				transactionHash: transaction.txHash,
			})
			expect((await arrayFilterLogNotification).result.address).toBe(address)

			const syncingResults: Array<boolean> = []
			let resolveSyncing!: (results: Array<boolean>) => void
			const syncingNotification = new Promise<Array<boolean>>((resolve) => {
				resolveSyncing = resolve
			})
			const syncingSubscription = await client.transport.subscribe({
				params: ['syncing'],
				onData(data) {
					syncingResults.push(data.result as boolean)
					if (syncingResults.length === 2) resolveSyncing(syncingResults)
				},
			})
			await expect.poll(() => syncingResults).toEqual([false])
			tevm.transport.tevm.status = 'SYNCING'
			expect(await syncingNotification).toEqual([false, true])

			await Promise.all([
				logSubscription.unsubscribe(),
				unfilteredLogSubscription.unsubscribe(),
				arrayFilterLogSubscription.unsubscribe(),
				pendingSubscription.unsubscribe(),
				syncingSubscription.unsubscribe(),
			])
			await expect.poll(() => tevm.transport.tevm.getFilters().size).toBe(0)
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	}, 15_000)

	it('returns JSON-RPC errors and batch responses over a real WebSocket', async () => {
		const tevm = createMemoryClient()
		const server = createServer(tevm)
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const port = (server.address() as AddressInfo).port
		const socket = new WebSocket(`ws://127.0.0.1:${port}`)
		await new Promise<void>((resolve, reject) => {
			socket.once('open', resolve)
			socket.once('error', reject)
		})
		const nextMessage = () =>
			new Promise<any>((resolve) => {
				socket.once('message', (data) => resolve(JSON.parse(data.toString())))
			})

		try {
			let response = nextMessage()
			socket.send('{')
			expect(await response).toMatchObject({ id: null, error: { code: -32700 } })

			response = nextMessage()
			socket.send('{}')
			expect(await response).toMatchObject({ id: null, error: { code: -32600 } })

			response = nextMessage()
			socket.send('null')
			expect(await response).toMatchObject({ id: null, error: { code: -32600 } })

			response = nextMessage()
			socket.send('{"method":1}')
			expect(await response).toMatchObject({ id: null, error: { code: -32600 } })

			response = nextMessage()
			socket.send('[]')
			expect(await response).toMatchObject({ id: null, error: { code: -32600 } })

			response = nextMessage()
			socket.send(
				JSON.stringify([
					{ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
					{ jsonrpc: '2.0', id: 2, method: 'eth_blockNumber', params: [] },
				]),
			)
			expect(await response).toEqual([
				expect.objectContaining({ id: 1, result: '0x384' }),
				expect.objectContaining({ id: 2, result: '0x0' }),
			])

			response = nextMessage()
			socket.send(
				JSON.stringify({
					jsonrpc: '2.0',
					id: 3,
					method: 'eth_unsubscribe',
					params: ['0xdead'],
				}),
			)
			expect(await response).toMatchObject({ id: 3, result: false })

			response = nextMessage()
			socket.send(JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [] }))
			socket.send(JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'eth_chainId', params: [] }))
			expect(await response).toMatchObject({ id: 4, result: '0x384' })

			response = nextMessage()
			socket.send(
				JSON.stringify([
					{ jsonrpc: '2.0', method: 'eth_chainId', params: [] },
					{ jsonrpc: '2.0', method: 'eth_blockNumber', params: [] },
				]),
			)
			socket.send(JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'eth_chainId', params: [] }))
			expect(await response).toMatchObject({ id: 5, result: '0x384' })

			response = nextMessage()
			socket.send(JSON.stringify([{ jsonrpc: '2.0', method: 'eth_chainId', params: [] }, {}]))
			expect(await response).toMatchObject([{ id: null, error: { code: -32600 } }])
		} finally {
			socket.close()
			await new Promise<void>((resolve) => socket.once('close', () => resolve()))
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	})
})
