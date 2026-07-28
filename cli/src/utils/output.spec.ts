import { describe, expect, it } from 'vitest'
import { formatHumanResult, formatJsonFailure, formatJsonSuccess, renderCallTrace } from './output.js'

describe('CLI output', () => {
	it('uses a stable success envelope and supports bigint', () => {
		expect(JSON.parse(formatJsonSuccess('get-chain-id', 10n, 'demo'))).toEqual({
			ok: true,
			command: 'get-chain-id',
			result: '10',
			session: 'demo',
		})
	})

	it('serializes sets and maps as typed JSON collections', () => {
		expect(JSON.parse(formatJsonSuccess('call', { set: new Set(['0x01']), map: new Map([['slot', 1n]]) }))).toEqual({
			ok: true,
			command: 'call',
			result: {
				set: ['0x01'],
				map: { slot: '1' },
			},
		})
	})

	it('uses a stable error envelope', () => {
		expect(JSON.parse(formatJsonFailure('call', new Error('reverted')))).toEqual({
			ok: false,
			command: 'call',
			error: { message: 'reverted' },
		})
	})

	it('renders a nested trace with decoded calls, gas, and reverts', () => {
		const abi = JSON.stringify([
			{
				type: 'function',
				name: 'balanceOf',
				stateMutability: 'view',
				inputs: [{ name: 'owner', type: 'address' }],
				outputs: [{ type: 'uint256' }],
			},
		])
		const trace = renderCallTrace(
			{
				type: 'CALL',
				to: '0x4200000000000000000000000000000000000006',
				input: '0x70a082310000000000000000000000000000000000000000000000000000000000000001',
				output: `0x${'0'.repeat(63)}1`,
				gasUsed: 2400n,
				calls: [
					{
						type: 'STATICCALL',
						to: '0x0000000000000000000000000000000000000001',
						input: '0x',
						output: '0x',
						gasUsed: 300n,
						revertReason: 'no balance',
					},
				],
			},
			abi,
		)
		expect(trace).toContain('balanceOf("0x0000000000000000000000000000000000000001") => 1')
		expect(trace).toContain('[gas 2400]')
		expect(trace).toContain('└─ STATICCALL')
		expect(trace).toContain('REVERT no balance')
	})

	it('formats ordinary human output', () => {
		expect(formatHumanResult('get-chain-id', 10n, {})).toBe('10')
	})
})
