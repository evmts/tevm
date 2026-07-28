import { createTevmNode } from '@tevm/node'
import { hexToString, numberToHex, parseEther } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { anvilDumpStateJsonRpcProcedure } from './anvilDumpStateProcedure.js'
import { anvilSetBalanceJsonRpcProcedure } from './anvilSetBalanceProcedure.js'

describe('anvilDumpStateJsonRpcProcedure', () => {
	it('should dump state correctly', async () => {
		const node = createTevmNode()
		const procedure = anvilDumpStateJsonRpcProcedure(node)

		const result = await procedure({
			method: 'anvil_dumpState',
			params: [],
			jsonrpc: '2.0',
		})

		expect(result.jsonrpc).toBe('2.0')
		expect(result.method).toBe('anvil_dumpState')
		expect(result.result).toMatch(/^0x[0-9a-f]+$/)
		const decoded = JSON.parse(hexToString(result.result))
		expect(decoded).toMatchObject({
			format: 'tevm-anvil-state-v1',
			state: expect.any(Object),
		})
	})

	it('should handle requests with id', async () => {
		const node = createTevmNode()
		const procedure = anvilDumpStateJsonRpcProcedure(node)

		const result = await procedure({
			method: 'anvil_dumpState',
			params: [],
			jsonrpc: '2.0',
			id: 1,
		})

		expect(result.id).toBe(1)
	})

	it('emits deterministic account order', async () => {
		const node = createTevmNode()
		const dump = anvilDumpStateJsonRpcProcedure(node)
		const setBalance = anvilSetBalanceJsonRpcProcedure(node)
		await setBalance({
			method: 'anvil_setBalance',
			params: ['0xff00000000000000000000000000000000000000', numberToHex(parseEther('1'))],
			jsonrpc: '2.0',
			id: 2,
		})
		await setBalance({
			method: 'anvil_setBalance',
			params: ['0x1100000000000000000000000000000000000000', numberToHex(parseEther('1'))],
			jsonrpc: '2.0',
			id: 3,
		})
		const result = await dump({ method: 'anvil_dumpState', params: [], jsonrpc: '2.0' })
		const keys = Object.keys(JSON.parse(hexToString(result.result)).state)
		const sorted = [...keys].sort((a, b) => a.localeCompare(b))
		expect(keys).toEqual(sorted)
	})

	it('explicitly refuses unsupported historical-state preservation', async () => {
		const node = createTevmNode()
		const result = await anvilDumpStateJsonRpcProcedure(node)({
			method: 'anvil_dumpState',
			params: [true],
			jsonrpc: '2.0',
			id: 4,
		})

		expect(result.error).toEqual({
			code: -32602,
			message:
				'anvil_dumpState does not support preserving historical states in Tevm. Pass false or omit the parameter.',
		})
	})
})
