import { describe, expect, it } from 'vitest'
import {
	BaseError,
	ContractExecutionFailedError,
	ExecutionError,
	ForkError,
	GasLimitExceededError,
	InternalError,
	InvalidAddressError,
	InvalidBalanceError,
	InvalidBytecodeError,
	InvalidDataError,
	InvalidGasLimitError,
	InvalidNonceError,
	InvalidParamsError,
	InvalidRequestError,
	InvalidSaltError,
	LimitExceededError,
	MethodNotFoundError,
	MethodNotSupportedError,
	ParseError,
	ResourceNotFoundError,
	ResourceUnavailableError,
	RevertError,
	TransactionRejectedError,
} from './index.js'

describe('error edge cases and JSON-RPC wire codes', () => {
	it('normalizes plain-object RPC causes in ForkError without crashing BaseError', () => {
		const fromPlain = new ForkError('Upstream RPC failed', {
			cause: { code: -32000, message: 'header not found' },
		})
		expect(fromPlain).toBeInstanceOf(ForkError)
		expect(fromPlain).toBeInstanceOf(BaseError)
		expect(fromPlain.name).toBe('ForkError')
		expect(fromPlain._tag).toBe('ForkError')
		expect(fromPlain.code).toBe(-32000)
		expect(fromPlain.message).toContain('Upstream RPC failed')
		expect(fromPlain.message).toContain('header not found')
		expect(fromPlain.cause).toBeInstanceOf(Error)
		expect(fromPlain.docsPath).toBe('/reference/tevm/errors/classes/forkerror/')

		const fromStringCode = new ForkError('Rate limited', {
			cause: { code: '-32005', message: 'limit exceeded' },
		})
		expect(fromStringCode.code).toBe(-32005)
		expect(fromStringCode.message).toContain('limit exceeded')

		const nativeCause = new Error('socket hang up')
		const fromError = new ForkError('Connection lost', {
			cause: nativeCause,
			docsPath: '/core/forking/',
		})
		expect(fromError.cause).toBe(nativeCause)
		expect(fromError.code).toBe(new ResourceNotFoundError('').code)
		expect(fromError.docsPath).toBe('/core/forking/')
	})

	it('walks nested BaseError and Error cause chains accurately', () => {
		const leaf = new RangeError('overflow in slot')
		const middle = new InvalidParamsError('Invalid slot parameter', { cause: leaf })
		const outer = new InternalError('Failed to execute call', {
			cause: middle,
			metaMessages: ['Slot: 0x01', 'Block: latest'],
		})

		expect(outer.walk()).toBe(leaf)
		expect(outer.walk((err: unknown) => err instanceof InvalidParamsError)).toBe(middle)
		expect(outer.walk((err: unknown) => err instanceof RangeError)).toBe(leaf)
		expect(outer.walk((err: unknown) => err instanceof ForkError)).toBeNull()
		expect(outer.metaMessages).toEqual(['Slot: 0x01', 'Block: latest'])
		expect(outer.message).toContain('Slot: 0x01')
		expect(outer.message).toContain('Block: latest')
		expect(outer.shortMessage).toBe('Failed to execute call')
		expect(outer.details).toBe('overflow in slot')
	})

	it('preserves canonical negative JSON-RPC 2.0 and EIP-1474 error codes', () => {
		const standardCases = [
			[new ParseError('bad json'), -32700],
			[new InvalidRequestError('missing method'), -32600],
			[new MethodNotFoundError('eth_nope'), -32601],
			[new InvalidParamsError('bad params'), -32602],
			[new InternalError('boom'), -32603],
			[new ResourceNotFoundError('missing block'), -32001],
			[new ResourceUnavailableError('syncing'), -32002],
			[new TransactionRejectedError('low nonce'), -32003],
			[new MethodNotSupportedError('not supported'), -32004],
			[new LimitExceededError('rate limit'), -32005],
		] as const

		for (const [error, expectedCode] of standardCases) {
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(expectedCode)
			expect(error.name).toBe(error._tag)
			expect(error.code).toBeLessThan(0)
			expect(typeof error.message).toBe('string')
			expect(error.message.length).toBeGreaterThan(0)
		}
	})

	it('preserves EVM execution and input validation error contracts', () => {
		const execErrors = [
			new ExecutionError('execution failed'),
			new RevertError('ERC20: insufficient balance'),
			new ContractExecutionFailedError('contract execution failed'),
			new GasLimitExceededError('gas limit exceeded'),
		]
		for (const err of execErrors) {
			expect(err).toBeInstanceOf(BaseError)
			expect(typeof err.code).toBe('number')
			expect(typeof err._tag).toBe('string')
			expect(err.message).toContain(err.shortMessage)
		}

		const addressErr = new InvalidAddressError('bad address')
		expect(addressErr).toBeInstanceOf(BaseError)
		expect(addressErr.code).toBe(-32013)

		const inputErrors = [
			new InvalidBalanceError('negative balance'),
			new InvalidBytecodeError('odd hex length'),
			new InvalidDataError('invalid calldata'),
			new InvalidGasLimitError('gas limit exceeds cap'),
			new InvalidNonceError('nonce too low'),
			new InvalidSaltError('invalid salt'),
		]
		for (const err of inputErrors) {
			expect(err).toBeInstanceOf(InvalidParamsError)
			expect(err).toBeInstanceOf(BaseError)
			expect(err.code).toBe(-32602)
			expect(err.docsPath).toBeTruthy()
		}
	})

	it('prevents direct BaseError instantiation and formats custom subclass docs links', () => {
		expect(() => new BaseError('abstract', {}, 'BaseError')).toThrow(TypeError)

		class CustomFactoryError extends BaseError {
			constructor() {
				super(
					'Custom failure',
					{
						docsBaseUrl: 'https://node.tevm.sh',
						docsPath: '/api/json-rpc',
						docsSlug: 'error-codes',
						details: 'underlying wire diagnostic',
					},
					'CustomFactoryError',
					-32099,
				)
			}
		}

		const err = new CustomFactoryError()
		expect(err).toBeInstanceOf(BaseError)
		expect(err.code).toBe(-32099)
		expect(err.message).toContain('Custom failure')
		expect(err.message).toContain('https://node.tevm.sh/api/json-rpc#error-codes')
		expect(err.message).toContain('Details: underlying wire diagnostic')
		expect(err.version).toMatch(/^\d+\.\d+\.\d+/)
	})
})
