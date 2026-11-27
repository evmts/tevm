import { encodeFunctionData, encodeFunctionResult, parseAbi } from 'viem'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
	createAddressOptions,
	createCommonOptions,
	createContractOptions,
	createReadContractOptions,
} from './options.js'
import { formatHumanResult, formatJsonFailure, formatJsonSuccess, renderCallTrace } from './output.js'

const ERC20_ABI = parseAbi([
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
])
const ERC20_ABI_JSON = JSON.stringify(ERC20_ABI)
const ALICE = '0x1111111111111111111111111111111111111111' as const
const BOB = '0x2222222222222222222222222222222222222222' as const

describe('cli output formatters', () => {
	it('formats JSON success envelopes with bigint, Set, Map, and Error serialization', () => {
		const raw = formatJsonSuccess(
			'get-account',
			{
				balance: 1000000000000000000n,
				tags: new Set(['local', 42n]),
				slots: new Map<string, bigint>([['0x0', 7n]]),
				warning: new TypeError('minor note'),
			},
			'dev-session',
		)
		const parsed = JSON.parse(raw)
		expect(parsed).toEqual({
			ok: true,
			command: 'get-account',
			session: 'dev-session',
			result: {
				balance: '1000000000000000000',
				tags: ['local', '42'],
				slots: { '0x0': '7' },
				warning: { name: 'TypeError', message: 'minor note' },
			},
		})
	})

	it('omits session key when formatJsonSuccess is called without a session', () => {
		const parsed = JSON.parse(formatJsonSuccess('get-chain-id', 900n))
		expect(parsed).toEqual({
			ok: true,
			command: 'get-chain-id',
			result: '900',
		})
		expect('session' in parsed).toBe(false)
	})

	it('formats JSON failure envelopes for Error, message objects, shortMessage objects, plain objects, and primitives', () => {
		expect(JSON.parse(formatJsonFailure('call', new Error('execution reverted'), 's1'))).toEqual({
			ok: false,
			command: 'call',
			session: 's1',
			error: { message: 'execution reverted' },
		})

		expect(JSON.parse(formatJsonFailure('call', { message: 'rpc timeout' }))).toEqual({
			ok: false,
			command: 'call',
			error: { message: 'rpc timeout' },
		})

		expect(JSON.parse(formatJsonFailure('call', { shortMessage: 'insufficient funds' }))).toEqual({
			ok: false,
			command: 'call',
			error: { message: 'insufficient funds' },
		})

		const fromStructured = JSON.parse(formatJsonFailure('call', { code: -32000, gas: 21000n }))
		expect(fromStructured.ok).toBe(false)
		expect(fromStructured.error.message).toContain('-32000')
		expect(fromStructured.error.message).toContain('21000')

		expect(JSON.parse(formatJsonFailure('call', 'raw string failure'))).toEqual({
			ok: false,
			command: 'call',
			error: { message: 'raw string failure' },
		})
	})

	it('renders nested call traces with ABI decoding, gas, reverts, errors, and fallback selectors', () => {
		const balanceInput = encodeFunctionData({
			abi: ERC20_ABI,
			functionName: 'balanceOf',
			args: [ALICE],
		})
		const balanceOutput = encodeFunctionResult({
			abi: ERC20_ABI,
			functionName: 'balanceOf',
			result: 500n,
		})
		const transferInput = encodeFunctionData({
			abi: ERC20_ABI,
			functionName: 'transfer',
			args: [BOB, 250n],
		})

		const tree = renderCallTrace(
			{
				type: 'CALL',
				to: ALICE,
				input: balanceInput,
				output: balanceOutput,
				gasUsed: 24500n,
				calls: [
					{
						type: 'CALL',
						to: BOB,
						input: transferInput,
						gasUsed: 12000n,
						revertReason: 'ERC20InsufficientBalance',
					},
					{
						type: 'STATICCALL',
						to: ALICE,
						input: '0xdeadbeef0000',
						gasUsed: 900n,
						error: 'out of gas',
						calls: [
							{
								type: 'CREATE',
								input: '0x',
							},
						],
					},
				],
			},
			ERC20_ABI_JSON,
		)

		expect(tree).toContain(`balanceOf("${ALICE}") => 500 [gas 24500]`)
		expect(tree).toContain(`├─ transfer("${BOB}", 250) [gas 12000] REVERT ERC20InsufficientBalance`)
		expect(tree).toContain(`└─ STATICCALL ${ALICE} 0xdeadbeef [gas 900] ERROR out of gas`)
		expect(tree).toContain('└─ CREATE <create>')
	})

	it('handles invalid ABI strings gracefully when rendering traces', () => {
		const rendered = renderCallTrace({ type: 'CALL', to: ALICE, input: '0x12345678', gasUsed: 100n }, 'not-valid-json')
		expect(rendered).toBe(`CALL ${ALICE} 0x12345678 [gas 100]`)
	})

	it('formats human results for strings, bigints, objects, and call trace payloads', () => {
		expect(formatHumanResult('get-chain-id', 900n, {})).toBe('900')
		expect(formatHumanResult('get-bytecode', '0x6000', {})).toBe('0x6000')
		expect(formatHumanResult('get-account', { balance: 42n }, {})).toContain('"balance": "42"')
		expect(formatHumanResult('call', { trace: { type: 'CALL', to: ALICE, input: '0x', gasUsed: 21000n } }, {})).toBe(
			`CALL ${ALICE} [gas 21000]`,
		)
	})
})

describe('cli option schema builders', () => {
	it('builds common options with expected defaults', () => {
		const schema = z.object(createCommonOptions())
		const parsed = schema.parse({})
		expect(parsed.local).toBe(false)
		expect(parsed.run).toBe(false)
		expect(typeof parsed.rpc).toBe('string')
		expect(typeof parsed.json).toBe('boolean')
		expect(parsed.session).toBeUndefined()
	})

	it('builds address, contract, and readContract option schemas', () => {
		const addressParsed = z.object(createAddressOptions()).parse({ address: ALICE, local: true })
		expect(addressParsed.address).toBe(ALICE)
		expect(addressParsed.local).toBe(true)

		const contractParsed = z.object(createContractOptions()).parse({ address: ALICE, abi: '[]' })
		expect(contractParsed.abi).toBe('[]')

		const readParsed = z.object(createReadContractOptions()).parse({
			address: ALICE,
			abi: '[]',
			functionName: 'balanceOf',
			args: `["${BOB}"]`,
			run: true,
			json: true,
			session: 'fork-1',
		})
		expect(readParsed).toMatchObject({
			address: ALICE,
			abi: '[]',
			functionName: 'balanceOf',
			args: `["${BOB}"]`,
			run: true,
			json: true,
			session: 'fork-1',
		})
	})
})
