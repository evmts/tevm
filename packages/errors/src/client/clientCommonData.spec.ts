import { describe, expect, it } from 'vitest'
import {
	BaseError,
	CommonMismatchError,
	DecodeFunctionDataError,
	DefensiveNullCheckError,
	EipNotEnabledError,
	EncodeFunctionReturnDataError,
	ExecutionError,
	ForkError,
	InternalError,
	InvalidBytesSizeError,
	InvalidParamsError,
	MisconfiguredClientError,
	NoForkTransportSetError,
	NoForkUrlSetError,
	rpcErrorCodeToMessage,
	UnreachableCodeError,
} from '../index.js'

describe('Client, common, data, defensive, fork, and utils error classes', () => {
	describe('MisconfiguredClientError', () => {
		it('uses default message and inherits InternalError (-32603)', () => {
			const error = new MisconfiguredClientError()
			expect(error).toBeInstanceOf(Error)
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(InternalError)
			expect(error.code).toBe(-32603)
			expect(error.name).toBe('MisconfiguredClientError')
			expect(error._tag).toBe('MisconfiguredClientError')
			expect(error.shortMessage).toBe('Misconfigured client error occurred.')
			expect(error.message).toContain('/reference/tevm/errors/classes/internalerror/')
		})

		it('accepts custom message, metaMessages, and cause', () => {
			const cause = new Error('Missing transport')
			const error = new MisconfiguredClientError('Client requires a transport or engine', {
				cause,
				metaMessages: ['Pass either fork or backend option'],
			})
			expect(error.shortMessage).toBe('Client requires a transport or engine')
			expect(error.walk()).toBe(cause)
			expect(error.message).toContain('https://tevm.sh/reference/tevm/errors/classes/internalerror/')
			expect(error.message).toContain('Pass either fork or backend option')
		})
	})

	describe('CommonMismatchError', () => {
		it('uses default message and inherits ExecutionError (-32015)', () => {
			const error = new CommonMismatchError()
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(ExecutionError)
			expect(error.code).toBe(-32015)
			expect(error.name).toBe('CommonMismatchError')
			expect(error._tag).toBe('CommonMismatchError')
			expect(error.shortMessage).toBe('Common mismatch error occurred.')
			expect(error.message).toContain('/reference/tevm/errors/classes/commonmismatcherror/')
		})

		it('propagates custom hardfork context and cause', () => {
			const cause = new Error('Block expects cancun, VM runs shanghai')
			const error = new CommonMismatchError('Hardfork mismatch between block and engine', {
				cause,
				metaMessages: ['Expected hardfork: cancun', 'Configured hardfork: shanghai'],
			})
			expect(error.walk()).toBe(cause)
			expect(error.message).toContain('Expected hardfork: cancun')
			expect(error.message).toContain('Configured hardfork: shanghai')
		})
	})

	describe('EipNotEnabledError', () => {
		it('uses default message and inherits ExecutionError (-32015)', () => {
			const error = new EipNotEnabledError()
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(ExecutionError)
			expect(error.code).toBe(-32015)
			expect(error.name).toBe('EipNotEnabledError')
			expect(error._tag).toBe('EipNotEnabledError')
			expect(error.shortMessage).toBe('EIP not enabled error occurred.')
			expect(error.message).toContain('/reference/tevm/errors/classes/eipnotenablederror/')
		})

		it('supports custom EIP message and docs overrides', () => {
			const error = new EipNotEnabledError('EIP-1153 transient storage requires Cancun or newer', {
				docsPath: '/core/runtime-model',
				metaMessages: ['Opcode: TSTORE (0x5d)'],
			})
			expect(error.message).toContain('EIP-1153 transient storage requires Cancun or newer')
			expect(error.message).toContain('/core/runtime-model')
			expect(error.message).toContain('Opcode: TSTORE (0x5d)')
		})
	})

	describe('InvalidBytesSizeError', () => {
		it('formats default size mismatch message and records actual and expected sizes', () => {
			const error = new InvalidBytesSizeError(2, 32)
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(InternalError)
			expect(error.code).toBe(-32603)
			expect(error.name).toBe('InvalidBytesSizeError')
			expect(error._tag).toBe('InvalidBytesSizeError')
			expect(error.size).toBe(2)
			expect(error.expectedSize).toBe(32)
			expect(error.shortMessage).toBe('Invalid bytes size. Expected 32, received 2')
			expect(error.message).toContain('/reference/tevm/errors/classes/internalerror/')
		})

		it('respects custom message and cause while preserving numeric properties', () => {
			const cause = new RangeError('Byte buffer truncated')
			const error = new InvalidBytesSizeError(19, 20, 'Ethereum address must be 20 bytes', {
				cause,
				metaMessages: ['Input: 0x1234'],
			})
			expect(error.size).toBe(19)
			expect(error.expectedSize).toBe(20)
			expect(error.shortMessage).toBe('Ethereum address must be 20 bytes')
			expect(error.walk()).toBe(cause)
			expect(error.message).toContain('Input: 0x1234')
		})
	})

	describe('Defensive errors', () => {
		it('constructs DefensiveNullCheckError with InternalError code -32603', () => {
			const error = new DefensiveNullCheckError('Expected non-null state root')
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(InternalError)
			expect(error.code).toBe(-32603)
			expect(error.name).toBe('DefensiveNullCheckError')
			expect(error._tag).toBe('DefensiveNullCheckError')
			expect(error.shortMessage).toBe('Expected non-null state root')
		})

		it('constructs UnreachableCodeError with never value context', () => {
			const error = new UnreachableCodeError('unknown-mode' as never, 'Unhandled mining mode')
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(InternalError)
			expect(error.code).toBe(-32603)
			expect(error.name).toBe('UnreachableCodeError')
			expect(error._tag).toBe('UnreachableCodeError')
			expect(error.message).toContain('Unhandled mining mode')
		})
	})

	describe('Fork errors', () => {
		it('wraps plain JSON-RPC error object causes without throwing BaseError abstract error', () => {
			const error = new ForkError('Upstream eth_getStorageAt failed', {
				cause: { code: -32005, message: 'daily request count exceeded' },
			})
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(ForkError)
			expect(error.code).toBe(-32005)
			expect(error.name).toBe('ForkError')
			expect(error._tag).toBe('ForkError')
			expect(error.cause).toBeInstanceOf(Error)
			expect((error.cause as Error).message).toBe('daily request count exceeded')
			expect(JSON.parse(JSON.stringify({ code: error.code, message: error.shortMessage }))).toEqual({
				code: -32005,
				message: 'Upstream eth_getStorageAt failed\ndaily request count exceeded',
			})
		})

		it('preserves standard Error causes on ForkError', () => {
			const cause = new Error('ECONNREFUSED 127.0.0.1:8545')
			const error = new ForkError('Could not connect to fork RPC', { cause })
			expect(error.cause).toBe(cause)
			expect(error.walk()).toBe(cause)
		})

		it('constructs NoForkTransportSetError and NoForkUrlSetError cleanly', () => {
			const noTransport = new NoForkTransportSetError('Fork transport missing')
			const noUrl = new NoForkUrlSetError('Fork URL missing')
			expect(noTransport).toBeInstanceOf(BaseError)
			expect(noUrl).toBeInstanceOf(BaseError)
			expect(noTransport.shortMessage).toBe('Fork transport missing')
			expect(noUrl.shortMessage).toBe('Fork URL missing')
		})
	})

	describe('ABI codec utility errors', () => {
		it('constructs DecodeFunctionDataError inheriting InvalidParamsError (-32602)', () => {
			const cause = new Error('Selector 0xdeadbeef not in ABI')
			const error = new DecodeFunctionDataError('Failed to decode calldata', {
				cause,
				metaMessages: ['Calldata: 0xdeadbeef'],
			})
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(InvalidParamsError)
			expect(error.code).toBe(-32602)
			expect(error.name).toBe('DecodeFunctionDataError')
			expect(error._tag).toBe('DecodeFunctionDataError')
			expect(error.walk()).toBe(cause)
		})

		it('constructs EncodeFunctionReturnDataError inheriting InvalidParamsError (-32602)', () => {
			const cause = new Error('Expected bigint, got string')
			const error = new EncodeFunctionReturnDataError('Failed to encode return value', {
				cause,
				metaMessages: ['Function: balanceOf(address)'],
			})
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(InvalidParamsError)
			expect(error.code).toBe(-32602)
			expect(error.name).toBe('EncodeFunctionReturnDataError')
			expect(error._tag).toBe('EncodeFunctionReturnDataError')
			expect(error.walk()).toBe(cause)
		})
	})

	describe('rpcErrorCodeToMessage map completeness', () => {
		const expectedMappings: Array<[keyof typeof rpcErrorCodeToMessage, string]> = [
			[-1, 'Unknown error'],
			[-32700, 'Parse error'],
			[-32600, 'Invalid request'],
			[-32601, 'Method not found'],
			[-32602, 'Invalid params'],
			[-32603, 'Internal error'],
			[-32000, 'Invalid input'],
			[-32001, 'Resource not found'],
			[-32002, 'Resource unavailable'],
			[-32003, 'Transaction rejected'],
			[-32004, 'Method not supported'],
			[-32005, 'Limit exceeded'],
			[-32006, 'Block gas limit exceeded'],
			[-32007, 'Unsupported chain'],
			[-32008, 'Nonce already used'],
			[-32009, 'Insufficient permissions'],
			[-32010, 'Transaction cost exceeds current gas limit'],
			[-32011, 'Transaction too large'],
			[-32012, 'Invalid gas price'],
			[-32013, 'Invalid address'],
			[-32014, 'Transaction underpriced'],
			[-32015, 'VM execution error'],
			[-32020, 'Account locked'],
			[-32042, 'Method not found'],
			[-32500, 'Invalid user operation'],
			[-32501, 'User operation validation error'],
			[-32521, 'Invalid signature'],
			[-32604, 'Record not found'],
			[-32605, 'Rate Limit'],
			[-32606, 'Illegal Ip'],
			[-32607, 'Call Limit'],
			[-32612, 'Tracing/debugging blocked'],
			[-32613, 'Tracing/debugging blocked'],
			[-32616, 'WebSocket response size exceeded'],
			[-33000, 'Payment required'],
			[-33100, 'Forbidden'],
			[-33200, 'Too Many Requests'],
			[-33300, 'Too Many Requests'],
			[-33400, 'Too Many Requests'],
			[3, 'Execution reverted'],
			[4001, 'User rejected request'],
			[4100, 'Unauthorized'],
			[4200, 'Method not supported'],
			[4900, 'Provider disconnected'],
			[4901, 'Provider disconnected from chain'],
		]

		it('maps every standard JSON-RPC, EIP-1474, EIP-1193, and provider code to a non-empty message', () => {
			for (const [code, expected] of expectedMappings) {
				expect(rpcErrorCodeToMessage[code]).toBe(expected)
			}
			expect(Object.keys(rpcErrorCodeToMessage).length).toBe(expectedMappings.length)
		})

		it('is cleanly JSON-serializable for wire diagnostics', () => {
			const serialized = JSON.parse(JSON.stringify(rpcErrorCodeToMessage)) as Record<string, string>
			expect(serialized['-32601']).toBe('Method not found')
			expect(serialized['3']).toBe('Execution reverted')
			expect(serialized['4001']).toBe('User rejected request')
		})
	})
})
