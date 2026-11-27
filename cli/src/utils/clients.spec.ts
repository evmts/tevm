import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { isViemAction, loadViemClient } from './clients.js'

describe('CLI client routing utilities', () => {
	const knownViemActions = [
		'createAccessList',
		'createBlockFilter',
		'createContractEventFilter',
		'createEventFilter',
		'estimateFeesPerGas',
		'readContract',
		'estimateGas',
		'getBalance',
		'getBlock',
		'getBlockNumber',
		'getBytecode',
		'getChainId',
		'getEnsAddress',
		'getEnsName',
		'getEnsText',
		'getGasPrice',
		'getStorageAt',
		'getTransaction',
		'getTransactionCount',
		'getTransactionReceipt',
		'multicall',
		'sendRawTransaction',
		'sendTransaction',
		'simulateCalls',
	] as const

	it('recognizes all 24 standard Viem action names', () => {
		for (const action of knownViemActions) {
			expect(isViemAction(action)).toBe(true)
		}
	})

	it('returns false for native TEVM-only action names', () => {
		for (const nativeAction of [
			'call',
			'contract',
			'deploy',
			'get-account',
			'set-account',
			'mine',
			'dump-state',
			'load-state',
		]) {
			expect(isViemAction(nativeAction)).toBe(false)
		}
	})

	it('connects to a real loopback JSON-RPC server and detects chain metadata', async () => {
		const server = createServer((req, res) => {
			let body = ''
			req.on('data', (chunk) => {
				body += chunk.toString()
			})
			req.on('end', () => {
				const payload = JSON.parse(body) as { id: number; method: string }
				res.setHeader('content-type', 'application/json')
				if (payload.method === 'eth_chainId') {
					res.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, result: '0x1' }))
					return
				}
				res.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, result: '0x2a' }))
			})
		})

		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		try {
			const { port } = server.address() as AddressInfo
			const client = await loadViemClient(`http://127.0.0.1:${port}`)
			expect(client).not.toBeNull()
			expect(client?.chain?.id).toBe(1)
			expect(await client?.getBlockNumber()).toBe(42n)
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
	})

	it('returns null gracefully when RPC endpoint is unreachable', async () => {
		const client = await loadViemClient('http://127.0.0.1:1')
		expect(client).toBeNull()
	})
})
