import { createAddress } from '@tevm/address'
import { createTevmNode } from '@tevm/node'
import { numberToHex } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { getAccountProcedure } from '../GetAccount/getAccountProcedure.js'
import { anvilDumpStateJsonRpcProcedure } from './anvilDumpStateProcedure.js'
import { anvilLoadStateJsonRpcProcedure } from './anvilLoadStateProcedure.js'
import { anvilSetBalanceJsonRpcProcedure } from './anvilSetBalanceProcedure.js'

describe('anvilLoadStateJsonRpcProcedure', () => {
	it('loads an opaque blob returned by anvil_dumpState and returns true', async () => {
		const client = createTevmNode()
		const loadStateProcedure = anvilLoadStateJsonRpcProcedure(client)
		const testAddress = createAddress('0x1234567890123456789012345678901234567890')
		const setBalance = anvilSetBalanceJsonRpcProcedure(client)
		await setBalance({
			method: 'anvil_setBalance',
			params: [testAddress.toString(), '0x3e8'],
			jsonrpc: '2.0',
			id: 1,
		})
		const dump = await anvilDumpStateJsonRpcProcedure(client)({
			method: 'anvil_dumpState',
			params: [],
			jsonrpc: '2.0',
			id: 2,
		})
		await setBalance({
			method: 'anvil_setBalance',
			params: [testAddress.toString(), '0x1'],
			jsonrpc: '2.0',
			id: 3,
		})

		const request = {
			method: 'anvil_loadState',
			params: [dump.result],
			jsonrpc: '2.0',
			id: 4,
		} as const

		const result = await loadStateProcedure(request)
		expect(result).toEqual({
			jsonrpc: '2.0',
			method: 'anvil_loadState',
			result: true,
			id: 4,
		})
		const account = await getAccountProcedure(client)({
			method: 'tevm_getAccount',
			params: [{ address: testAddress.toString() }],
			jsonrpc: '2.0',
			id: 5,
		})
		expect(account.result?.balance).toBe(numberToHex(1000n))
	})

	it('returns error for malformed state blob', async () => {
		const client = createTevmNode()
		const loadStateProcedure = anvilLoadStateJsonRpcProcedure(client)

		const result = await loadStateProcedure({
			method: 'anvil_loadState',
			params: ['0x1234'],
			jsonrpc: '2.0',
			id: 2,
		})

		expect(result.error?.code).toBe(-32602)
		expect(result.error?.message).toContain('Invalid anvil_loadState blob')
	})

	it('explicitly refuses a real-Anvil-format blob it cannot decode', async () => {
		const client = createTevmNode()
		const loadStateProcedure = anvilLoadStateJsonRpcProcedure(client)
		const result = await loadStateProcedure({
			method: 'anvil_loadState',
			params: ['0x0001'],
			jsonrpc: '2.0',
			id: 3,
		})
		expect(result.error?.code).toBe(-32602)
		expect(result.error?.message).toContain('Invalid anvil_loadState blob')
	})
})
