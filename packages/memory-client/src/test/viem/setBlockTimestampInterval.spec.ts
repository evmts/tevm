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

describe('setBlockTimestampInterval', () => {
	it('should set a consistent interval between block timestamps', async () => {
		const interval = 5n
		const headBefore = await client.getBlock()

		await client.setBlockTimestampInterval({ interval })
		await client.mine({ blocks: 3 })

		const block1 = await client.getBlock({ blockNumber: headBefore.number + 1n })
		const block2 = await client.getBlock({ blockNumber: headBefore.number + 2n })
		const block3 = await client.getBlock({ blockNumber: headBefore.number + 3n })

		// Every mined block - including the first one after setting the interval - must
		// advance its timestamp by exactly the configured interval (anvil semantics)
		expect(block1.timestamp - headBefore.timestamp).toBe(interval)
		expect(block2.timestamp - block1.timestamp).toBe(interval)
		expect(block3.timestamp - block2.timestamp).toBe(interval)
	})
})
