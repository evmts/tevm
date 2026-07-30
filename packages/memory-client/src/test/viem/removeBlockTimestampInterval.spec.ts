import { type TestActions, testActions } from 'viem'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryClient } from '../../createMemoryClient.js'
import type { MemoryClient } from '../../MemoryClient.js'

let client: MemoryClient<any, any> & TestActions

beforeEach(async () => {
	// Create a memory client extended with test actions
	client = createMemoryClient({ miningConfig: { type: 'manual' } }).extend(testActions({ mode: 'anvil' }))
	await client.tevmReady()
})

describe('removeBlockTimestampInterval', () => {
	it('should remove a previously set block timestamp interval and restore default timestamps', async () => {
		const interval = 1_000_000n

		await client.setBlockTimestampInterval({ interval })
		await client.removeBlockTimestampInterval()

		const before = Math.floor(Date.now() / 1000)
		await client.mine({ blocks: 1 })
		const after = Math.floor(Date.now() / 1000)

		const block = await client.getBlock({ blockTag: 'latest' })
		// With the interval removed, the next block timestamp must go back to being
		// based on the current wall-clock time instead of parent + interval
		expect(Number(block.timestamp)).toBeGreaterThanOrEqual(before)
		expect(Number(block.timestamp)).toBeLessThanOrEqual(after + 1)
	})
})
