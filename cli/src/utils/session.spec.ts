import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
	getSessionPath,
	normalizeSessionState,
	parseSessionBlockNumber,
	readSession,
	restoreSessionBlockNumber,
	writeSession,
} from './session.js'

describe('CLI sessions', () => {
	it('persists and restores a pinned fork session', () => {
		const directory = mkdtempSync(path.join(tmpdir(), 'tevm-cli-session-'))
		const session = {
			version: 1 as const,
			name: 'optimism',
			forkUrl: 'https://mainnet.optimism.io',
			forkBlock: '123',
			updatedAt: '2026-07-27T00:00:00.000Z',
			state: { state: {} },
		}
		const written = writeSession(session, directory)
		expect(written).toBe(getSessionPath('optimism', directory))
		expect(readSession('optimism', directory)).toEqual(session)
		expect(JSON.parse(readFileSync(written, 'utf8'))).toEqual(session)
	})

	it('returns undefined for a missing session', () => {
		const directory = mkdtempSync(path.join(tmpdir(), 'tevm-cli-session-'))
		expect(readSession('missing', directory)).toBeUndefined()
	})

	it('rejects path traversal', () => {
		expect(() => getSessionPath('../escape', '/tmp')).toThrow('Session names')
	})

	it('expands compact storage words for the state loader', () => {
		const state = {
			state: {
				'0x01': {
					storage: {
						'0x00': '0x2a',
					},
				},
			},
		}
		expect((normalizeSessionState(state)['state'] as Record<string, any>)['0x01'].storage['0x00']).toBe(
			`0x${'0'.repeat(62)}2a`,
		)
		expect((state.state['0x01'] as any).storage['0x00']).toBe('0x2a')
	})

	it('validates session block numbers', () => {
		expect(parseSessionBlockNumber('123', 'forkBlock')).toBe(123n)
		expect(() => parseSessionBlockNumber('-1', 'blockNumber')).toThrow('non-negative decimal')
		expect(() => parseSessionBlockNumber('0x10', 'forkBlock')).toThrow('non-negative decimal')
	})

	it('restores a persisted block height by mining the difference', async () => {
		const calls: Array<{ blockCount: number; interval: number }> = []
		await restoreSessionBlockNumber(
			{
				getBlockNumber: async () => 2n,
				tevmMine: async (params) => {
					calls.push(params)
				},
			},
			{
				version: 1,
				name: 'local',
				blockNumber: '5',
				updatedAt: '2026-07-27T00:00:00.000Z',
			},
		)
		expect(calls).toEqual([{ blockCount: 3, interval: 1 }])
	})
})
