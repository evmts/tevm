import { mkdtemp, rm } from 'node:fs/promises'
import { connect, type Server, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMemoryClient, type MemoryClient } from '@tevm/memory-client'
import { SimpleContract } from '@tevm/test-utils'
import { createPublicClient, encodeEventTopics, encodeFunctionData } from 'viem'
import { getIpcRpcClient, type IpcRpcClient, ipc } from 'viem/node'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createIpcServer } from './createIpcServer.js'
import { extractJsonRpcFrames } from './internal/extractJsonRpcFrames.js'

const listen = (server: Server, path: string) =>
	new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(path, () => {
			server.off('error', reject)
			resolve()
		})
	})

const close = (server: Server) =>
	new Promise<void>((resolve, reject) => {
		server.close((error) => {
			if (error) reject(error)
			else resolve()
		})
	})

const openSocket = (path: string) =>
	new Promise<Socket>((resolve, reject) => {
		const socket = connect(path)
		socket.once('error', reject)
		socket.once('connect', () => {
			socket.off('error', reject)
			resolve(socket)
		})
	})

const readJsonLines = (socket: Socket, count: number) =>
	new Promise<Array<unknown>>((resolve, reject) => {
		let buffer = ''
		const messages: Array<unknown> = []
		const onData = (chunk: Buffer) => {
			buffer += chunk.toString('utf8')
			const lines = buffer.split('\n')
			buffer = lines.pop() ?? ''
			for (const line of lines) {
				if (line.trim().length === 0) continue
				try {
					messages.push(JSON.parse(line))
				} catch (error) {
					cleanup()
					reject(error)
					return
				}
				if (messages.length === count) {
					cleanup()
					resolve(messages)
					return
				}
			}
		}
		const onError = (error: Error) => {
			cleanup()
			reject(error)
		}
		const cleanup = () => {
			socket.off('data', onData)
			socket.off('error', onError)
		}
		socket.on('data', onData)
		socket.on('error', onError)
	})

describe('createIpcServer', () => {
	let client: MemoryClient
	let directory: string
	let rpcClient: IpcRpcClient | undefined
	let server: Server
	let socket: Socket | undefined
	let socketPath: string

	beforeEach(async () => {
		client = createMemoryClient({ miningConfig: { type: 'manual' } })
		directory = await mkdtemp(join(tmpdir(), 'tevm-ipc-'))
		socketPath = join(directory, 'tevm.ipc')
		server = createIpcServer(client)
		await listen(server, socketPath)
	})

	afterEach(async () => {
		socket?.destroy()
		rpcClient?.close()
		await close(server)
		await rm(directory, { recursive: true, force: true })
	})

	it('serves requests from viem ipc()', async () => {
		const publicClient = createPublicClient({
			transport: ipc(socketPath, { reconnect: false }),
		})
		rpcClient = await getIpcRpcClient(socketPath, { reconnect: false })

		await expect(publicClient.getChainId()).resolves.toBe(900)
	})

	it('handles fragmented newline-delimited JSON-RPC messages', async () => {
		socket = await openSocket(socketPath)
		const responses = readJsonLines(socket, 2)

		socket.write('{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}\n{"json')
		socket.write('rpc":"2.0","method":"eth_blockNumber","params":[],"id":2}\n')

		await expect(responses).resolves.toEqual([
			expect.objectContaining({ id: 1, jsonrpc: '2.0', result: '0x384' }),
			expect.objectContaining({ id: 2, jsonrpc: '2.0', result: '0x0' }),
		])
	})

	it('extracts concatenated frames without treating string braces as delimiters', () => {
		const frame = JSON.stringify({ jsonrpc: '2.0', method: 'test', params: ['a } brace and a " quote'], id: 1 })

		expect(extractJsonRpcFrames(`${frame}${frame}`)).toEqual([[frame, frame], ''])
		expect(extractJsonRpcFrames('not-json')).toEqual([[], 'not-json'])
	})

	it('handles batch requests, notifications, and invalid newline-delimited messages', async () => {
		socket = await openSocket(socketPath)
		const responses = readJsonLines(socket, 3)

		socket.write(
			`${JSON.stringify([
				{ jsonrpc: '2.0', method: 'eth_chainId', params: [] },
				{ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 2 },
			])}\n`,
		)
		socket.write('not-json\n')
		socket.write('{"jsonrpc":"2.0","params":[],"id":3}\n')

		await expect(responses).resolves.toEqual([
			[expect.objectContaining({ id: 2, result: '0x0' })],
			expect.objectContaining({ error: expect.objectContaining({ code: -32700 }), id: null }),
			expect.objectContaining({ error: expect.objectContaining({ code: -32600 }), id: null }),
		])
	})

	it('rejects messages larger than the configured limit', async () => {
		await close(server)
		server = createIpcServer(client, {}, { maxMessageSize: 8 })
		await listen(server, socketPath)
		socket = await openSocket(socketPath)
		const response = readJsonLines(socket, 1)

		socket.write('{"jsonrpc":"2.0","method":"eth_chainId","id":1}\n')

		await expect(response).resolves.toEqual([
			expect.objectContaining({ error: expect.objectContaining({ code: -32600 }), id: null }),
		])
	})

	it('streams subscription notifications through viem ipc()', async () => {
		const transport = ipc(socketPath, { reconnect: false })({
			chain: undefined,
			retryCount: 0,
			timeout: 2_000,
		})
		rpcClient = await getIpcRpcClient(socketPath)
		let rejectNotification: (reason?: unknown) => void
		let resolveNotification: (value: Record<string, unknown>) => void
		const notification = new Promise<Record<string, unknown>>((resolve, reject) => {
			rejectNotification = reject
			resolveNotification = resolve
		})
		if (!transport.value) throw new Error('IPC transport did not expose a subscription client')
		const { unsubscribe } = await transport.value.subscribe({
			params: ['newHeads'],
			onData: resolveNotification!,
			onError: rejectNotification!,
		})

		await client.tevmMine({ blockCount: 1 })
		await expect(notification).resolves.toEqual({
			result: expect.objectContaining({ number: '0x1' }),
			subscription: expect.stringMatching(/^0x/),
		})
		await unsubscribe()
	})

	it('streams pending transaction subscriptions through viem ipc()', async () => {
		const transport = ipc(socketPath, { reconnect: false })({
			chain: undefined,
			retryCount: 0,
			timeout: 2_000,
		})
		rpcClient = await getIpcRpcClient(socketPath)
		const notification = Promise.withResolvers<Record<string, unknown>>()
		if (!transport.value) throw new Error('IPC transport did not expose a subscription client')
		const { unsubscribe } = await transport.value.subscribe({
			params: ['newPendingTransactions'],
			onData: notification.resolve,
			onError: notification.reject,
		})
		const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
		await client.tevmSetAccount({ address: sender, balance: 10n ** 20n })

		const transaction = await client.tevmCall({
			createTransaction: true,
			from: sender,
			to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
			value: 1n,
		})

		expect(transaction.errors).toBeUndefined()
		await expect(notification.promise).resolves.toEqual({
			result: transaction.txHash,
			subscription: expect.stringMatching(/^0x/),
		})
		await unsubscribe()
	})

	it('streams filtered log subscriptions through viem ipc()', async () => {
		const transport = ipc(socketPath, { reconnect: false })({
			chain: undefined,
			retryCount: 0,
			timeout: 2_000,
		})
		rpcClient = await getIpcRpcClient(socketPath)
		const notification = Promise.withResolvers<Record<string, unknown>>()
		const contract = '0x1234567890123456789012345678901234567890'
		const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
		await client.tevmSetAccount({ address: sender, balance: 10n ** 20n })
		await client.tevmSetAccount({ address: contract, deployedBytecode: SimpleContract.deployedBytecode })
		const [eventTopic] = encodeEventTopics({
			abi: SimpleContract.abi,
			eventName: 'ValueSet',
		})
		if (!transport.value) throw new Error('IPC transport did not expose a subscription client')
		const { unsubscribe } = await transport.value.subscribe({
			params: [
				'logs',
				{
					address: ['0x0000000000000000000000000000000000000000', contract],
					topics: [[`0x${'0'.repeat(64)}`, eventTopic]],
				},
			],
			onData: notification.resolve,
			onError: notification.reject,
		})

		const transaction = await client.tevmCall({
			createTransaction: true,
			data: encodeFunctionData(SimpleContract.write.set(42n)),
			from: sender,
			to: contract,
		})
		expect(transaction.errors).toBeUndefined()
		await client.tevmMine({ blockCount: 1 })

		await expect(notification.promise).resolves.toEqual({
			result: expect.objectContaining({
				address: contract,
				blockNumber: '0x1',
				topics: expect.arrayContaining([expect.stringMatching(/^0x/)]),
				transactionHash: transaction.txHash,
			}),
			subscription: expect.stringMatching(/^0x/),
		})
		await unsubscribe()
	})

	it('supports syncing subscriptions and cleans them up when the socket closes', async () => {
		const transport = ipc(socketPath, { reconnect: false })({
			chain: undefined,
			retryCount: 0,
			timeout: 2_000,
		})
		rpcClient = await getIpcRpcClient(socketPath)
		if (!transport.value) throw new Error('IPC transport did not expose a subscription client')
		const { subscriptionId } = await transport.value.subscribe({
			params: ['syncing'],
			onData: () => {},
		})

		expect(client.transport.tevm.getFilters().has(subscriptionId)).toBe(true)
		rpcClient.close()
		rpcClient = undefined
		await expect.poll(() => client.transport.tevm.getFilters().has(subscriptionId)).toBe(false)
	})
})
