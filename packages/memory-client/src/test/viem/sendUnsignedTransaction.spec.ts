import { hexToBytes, PREFUNDED_ACCOUNTS } from '@tevm/utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryClient } from '../../createMemoryClient.js'
import type { MemoryClient } from '../../MemoryClient.js'

let mc: MemoryClient<any, any>

beforeEach(async () => {
	mc = createMemoryClient()
	await mc.tevmReady()
})

describe('sendUnsignedTransaction', () => {
	it('should send a transaction from a funded account without a signature', async () => {
		const from = PREFUNDED_ACCOUNTS[0].address
		const to = `0x${'69'.repeat(20)}` as const

		const hash = await mc.sendUnsignedTransaction({ from, to, value: 420n })
		expect(hash).toMatch(/^0x[0-9a-f]{64}$/)

		await mc.tevmMine()

		const receipt = await mc.getTransactionReceipt({ hash })
		expect(receipt.status).toBe('success')
		expect(receipt.from.toLowerCase()).toBe(from.toLowerCase())
		expect(receipt.to?.toLowerCase()).toBe(to)
		expect(await mc.getBalance({ address: to })).toBe(420n)
	})

	it('should send a transaction from an arbitrary unfunded account', async () => {
		const from = `0x${'11'.repeat(20)}` as const
		const to = `0x${'69'.repeat(20)}` as const
		expect(await mc.getBalance({ address: from })).toBe(0n)

		const hash = await mc.sendUnsignedTransaction({ from, to, value: 0n })
		await mc.tevmMine()

		const receipt = await mc.getTransactionReceipt({ hash })
		expect(receipt.status).toBe('success')
		expect(receipt.from.toLowerCase()).toBe(from)
	})

	it('should add the transaction to the txpool when mining is manual', async () => {
		const manual = createMemoryClient({ miningConfig: { type: 'manual' } })
		await manual.tevmReady()
		const from = `0x${'22'.repeat(20)}` as const
		const hash = await manual.sendUnsignedTransaction({
			from,
			to: `0x${'69'.repeat(20)}`,
			value: 0n,
		})
		const txPool = await manual.transport.tevm.getTxPool()
		const pooled = txPool.getByHash([hexToBytes(hash)])
		expect(pooled.length).toBe(1)
	})
})
