import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createSessionManager, executeTool, toJsonValue } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

let sessions: ReturnType<typeof createSessionManager>
let handle: string

const sampleValue = {
	blockNumber: 123456n,
	gasUsed: 21000n,
	data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
	logs: [
		{ address: '0x0000000000000000000000000000000000000001', topics: ['0x01', '0x02'], value: 999999999999999999n },
		{ address: '0x0000000000000000000000000000000000000002', topics: ['0x03'], value: 42n },
	],
	tags: new Set(['tx', 'receipt', 'log']),
}

beforeAll(async () => {
	sessions = createSessionManager()
	const created = (await executeTool('evm_create_session', {}, sessions)) as { handle: string }
	handle = created.handle
})

afterAll(async () => {
	await executeTool('evm_close_session', { session: handle }, sessions)
})

describe('@tevm/mcp', () => {
	bench(
		'toJsonValue (nested bigint/Uint8Array/Set/object)',
		() => {
			const out = toJsonValue(sampleValue)
			if (!out) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'executeTool("evm_get_account")',
		async () => {
			const res = await executeTool(
				'evm_get_account',
				{ session: handle, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
				sessions,
			)
			if (!res) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'executeTool("evm_mine")',
		async () => {
			const res = await executeTool('evm_mine', { session: handle, blockCount: 1 }, sessions)
			if (!res) throw new Error('unexpected')
		},
		benchOpts,
	)
})
