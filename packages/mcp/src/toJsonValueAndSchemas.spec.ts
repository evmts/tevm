import { describe, expect, it } from 'vitest'
import { toJsonValue } from './toJsonValue.js'
import { toolDefinitions } from './toolDefinitions.js'
import { toolSchemas } from './toolSchemas.js'

const SESSION = '11111111-1111-4111-8111-111111111111'
const ADDRESS = '0x0000000000000000000000000000000000000123'
const HASH = `0x${'ab'.repeat(32)}`

describe('toJsonValue', () => {
	it('serializes bigints, Uint8Array, Set, Map, and nested objects without losing precision', () => {
		const nested = {
			gasUsed: 21000n,
			maxUint256: (1n << 256n) - 1n,
			raw: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
			tags: new Set([1n, 'a']),
			lookup: new Map<unknown, unknown>([
				['slot', 42n],
				[7, new Uint8Array([0x01])],
			]),
			list: [0n, 'ok', true, null],
		}

		expect(toJsonValue(nested)).toEqual({
			gasUsed: '21000',
			maxUint256: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
			raw: '0xdeadbeef',
			tags: ['1', 'a'],
			lookup: { slot: '42', '7': '0x01' },
			list: ['0', 'ok', true, null],
		})
	})

	it('serializes Error instances including recursive cause chains', () => {
		const rootCause = new TypeError('inner failure')
		const outer = new Error('outer failure', { cause: rootCause })
		expect(toJsonValue(outer)).toEqual({
			name: 'Error',
			message: 'outer failure',
			cause: {
				name: 'TypeError',
				message: 'inner failure',
			},
		})
	})

	it('passes primitives and undefined through unchanged', () => {
		expect(toJsonValue(null)).toBeNull()
		expect(toJsonValue(undefined)).toBeUndefined()
		expect(toJsonValue(42)).toBe(42)
		expect(toJsonValue('0x1234')).toBe('0x1234')
		expect(toJsonValue(false)).toBe(false)
	})
})

describe('toolSchemas and toolDefinitions parity', () => {
	it('defines a runtime schema for every declared MCP tool', () => {
		const definitionNames = toolDefinitions.map((d) => d.name).sort()
		const schemaNames = Object.keys(toolSchemas).sort()
		expect(schemaNames).toEqual(definitionNames)
	})

	it('validates evm_create_session and rejects unknown properties', () => {
		expect(toolSchemas.evm_create_session.parse({})).toEqual({})
		expect(() => toolSchemas.evm_create_session.parse({ extra: true })).toThrow()
	})

	it('enforces http/https protocol on evm_fork_chain', () => {
		const parsed = toolSchemas.evm_fork_chain.parse({ url: 'https://eth.llamarpc.com' })
		expect(parsed).toEqual({ url: 'https://eth.llamarpc.com', chain: 'auto' })
		expect(() => toolSchemas.evm_fork_chain.parse({ url: 'file:///etc/passwd' })).toThrow(/http or https/)
		expect(() => toolSchemas.evm_fork_chain.parse({ url: 'https://example.com', blockNumber: '01' })).toThrow()
	})

	it('requires abi or signature for contract calls and transactions', () => {
		expect(() => toolSchemas.evm_call_contract.parse({ session: SESSION, address: ADDRESS })).toThrow(
			/Provide abi or signature/,
		)
		expect(() => toolSchemas.evm_send_transaction.parse({ session: SESSION, address: ADDRESS })).toThrow(
			/Provide abi or signature/,
		)
		const parsed = toolSchemas.evm_call_contract.parse({
			session: SESSION,
			address: ADDRESS,
			signature: 'balanceOf(address) view returns (uint256)',
			args: [ADDRESS],
		})
		expect(parsed).toMatchObject({ session: SESSION, address: ADDRESS, args: [ADDRESS] })
	})

	it('requires bytecode or source for evm_deploy_contract and defaults optimize=true', () => {
		expect(() => toolSchemas.evm_deploy_contract.parse({ session: SESSION })).toThrow(/bytecode or Solidity source/)
		expect(toolSchemas.evm_deploy_contract.parse({ session: SESSION, bytecode: '0x60006000f3' })).toMatchObject({
			optimize: true,
			args: [],
		})
	})

	it('validates evm_set_account requires at least one state mutation', () => {
		expect(() => toolSchemas.evm_set_account.parse({ session: SESSION, address: ADDRESS })).toThrow(
			/at least one state field/,
		)
		expect(
			toolSchemas.evm_set_account.parse({
				session: SESSION,
				address: ADDRESS,
				balance: '1000',
				storage: { '0x00': '0x2a' },
			}),
		).toMatchObject({ balance: '1000' })
	})

	it('validates evm_mine, evm_get_block, evm_trace_call, and evm_compile_solidity bounds', () => {
		expect(toolSchemas.evm_mine.parse({ session: SESSION })).toEqual({ session: SESSION, blockCount: 1 })
		expect(() => toolSchemas.evm_mine.parse({ session: SESSION, blockCount: 0 })).toThrow()
		expect(() => toolSchemas.evm_mine.parse({ session: SESSION, blockCount: 101 })).toThrow()

		expect(() => toolSchemas.evm_get_block.parse({ session: SESSION, blockNumber: '1', blockHash: HASH })).toThrow(
			/only one of blockNumber or blockHash/,
		)

		expect(() => toolSchemas.evm_trace_call.parse({ session: SESSION, address: ADDRESS })).toThrow(
			/Provide data, abi, or signature/,
		)
		expect(toolSchemas.evm_trace_call.parse({ session: SESSION, address: ADDRESS, data: '0x' })).toMatchObject({
			maxSteps: 200,
		})

		expect(toolSchemas.evm_compile_solidity.parse({ source: 'contract A {}' })).toEqual({
			source: 'contract A {}',
			optimize: true,
		})
	})
})
