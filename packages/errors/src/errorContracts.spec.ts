import { describe, expect, it } from 'vitest'
import * as errors from './index.js'

const standardRpcErrorCases = [
	{ label: 'ParseError', Ctor: errors.ParseError, code: -32700 },
	{ label: 'InvalidRequestError', Ctor: errors.InvalidRequestError, code: -32600 },
	{ label: 'MethodNotFoundError', Ctor: errors.MethodNotFoundError, code: -32601 },
	{ label: 'InvalidParamsError', Ctor: errors.InvalidParamsError, code: -32602 },
	{ label: 'InternalError', Ctor: errors.InternalError, code: -32603 },
	{ label: 'ResourceNotFoundError', Ctor: errors.ResourceNotFoundError, code: -32001 },
	{ label: 'ResourceUnavailableError', Ctor: errors.ResourceUnavailableError, code: -32002 },
	{ label: 'TransactionRejectedError', Ctor: errors.TransactionRejectedError, code: -32003 },
	{ label: 'MethodNotSupportedError', Ctor: errors.MethodNotSupportedError, code: -32004 },
	{ label: 'LimitExceededError', Ctor: errors.LimitExceededError, code: -32005 },
] as const

const ethereumDomainErrors = [
	errors.AccountLockedError,
	errors.AccountNotFoundError,
	errors.BlobGasLimitExceededError,
	errors.BlockGasLimitExceededError,
	errors.ChainIdMismatchError,
	errors.ContractExecutionFailedError,
	errors.ExecutionError,
	errors.GasLimitExceededError,
	errors.InsufficientFundsError,
	errors.InsufficientPermissionsError,
	errors.InvalidAddressError,
	errors.InvalidGasPriceError,
	errors.InvalidSignatureError,
	errors.InvalidTransactionError,
	errors.NonceAlreadyUsedError,
	errors.NonceTooHighError,
	errors.NonceTooLowError,
	errors.NoSignerAvailableError,
	errors.PendingTransactionTimeoutError,
	errors.RateLimitExceededError,
	errors.RevertError,
	errors.TransactionTooLargeError,
	errors.TransactionUnderpricedError,
	errors.UnknownBlockError,
	errors.UnsupportedChainError,
] as const

const inputValidationErrors = [
	errors.InvalidAbiError,
	errors.InvalidAddToBlockchainError,
	errors.InvalidAddToMempoolError,
	errors.InvalidArgsError,
	errors.InvalidBalanceError,
	errors.InvalidBlobVersionedHashesError,
	errors.InvalidBlockError,
	errors.InvalidBytecodeError,
	errors.InvalidCallerError,
	errors.InvalidDataError,
	errors.InvalidDeployedBytecodeError,
	errors.InvalidDepthError,
	errors.InvalidFunctionNameError,
	errors.InvalidGasLimitError,
	errors.InvalidGasRefundError,
	errors.InvalidMaxFeePerGasError,
	errors.InvalidMaxPriorityFeePerGasError,
	errors.InvalidNonceError,
	errors.InvalidOriginError,
	errors.InvalidSaltError,
	errors.InvalidSelfdestructError,
	errors.InvalidSkipBalanceError,
	errors.InvalidStorageRootError,
	errors.InvalidToError,
	errors.InvalidUrlError,
	errors.InvalidValueError,
] as const

const utilityAndDefensiveErrors = [
	errors.CommonMismatchError,
	errors.EipNotEnabledError,
	errors.MisconfiguredClientError,
	errors.DefensiveNullCheckError,
	errors.NoForkTransportSetError,
	errors.NoForkUrlSetError,
	errors.DecodeFunctionDataError,
	errors.EncodeFunctionReturnDataError,
] as const

describe('@tevm/errors wire contract and BaseError invariants', () => {
	it.each(standardRpcErrorCases)('$label exposes canonical JSON-RPC code $code', ({ Ctor, code }) => {
		const err = new Ctor('wire contract failure', {
			metaMessages: ['ctx: json-rpc'],
			details: 'exact diagnostic detail',
		})
		expect(err).toBeInstanceOf(Error)
		expect(err).toBeInstanceOf(errors.BaseError)
		expect(err._tag).toBe(err.name)
		expect(err.code).toBe(code)
		expect(Ctor.code).toBe(code)
		expect(err.message).toContain('wire contract failure')
		expect(err.message).toContain('ctx: json-rpc')
		expect(err.message).toContain('exact diagnostic detail')
	})

	it('constructs every Ethereum domain error with canonical code, BaseError ancestry, and cause chaining', () => {
		for (const Ctor of ethereumDomainErrors) {
			const rootCause = new Error('native zevm cause')
			const err = new Ctor('domain failure', {
				cause: rootCause,
				metaMessages: ['chain: 31337'],
			})
			expect(err).toBeInstanceOf(errors.BaseError)
			expect(typeof err.code).toBe('number')
			// EIP-1474/JSON-RPC uses negative codes except RevertError (EIP-1474 execution reverted code 3)
			expect(err.code < 0 || err.code === 3).toBe(true)
			expect(err._tag).toBe(err.name)
			expect(err.cause).toBe(rootCause)
			expect(err.message).toContain('domain failure')
			expect(err.message).toContain('native zevm cause')
			expect(err.walk()).toBe(rootCause)
			expect(err.walk((e: unknown) => e === err)).toBe(err)
		}
	})

	it('constructs every input validation error with InvalidParams code and diagnostic metadata', () => {
		for (const Ctor of inputValidationErrors) {
			const err = new Ctor('bad parameter value', {
				metaMessages: ['field: input'],
				details: 'expected canonical hex',
			})
			expect(err).toBeInstanceOf(errors.BaseError)
			expect(err.code).toBe(-32602)
			expect(err._tag).toBe(err.name)
			expect(err.message).toContain('bad parameter value')
			expect(err.message).toContain('field: input')
			expect(err.message).toContain('expected canonical hex')
		}
	})

	it('constructs utility, fork, client, common, data, and defensive errors cleanly', () => {
		for (const Ctor of utilityAndDefensiveErrors) {
			const err = new Ctor('subsystem invariant violated', {
				metaMessages: ['subsystem: core'],
			})
			expect(err).toBeInstanceOf(errors.BaseError)
			expect(err._tag).toBe(err.name)
			expect(err.message).toContain('subsystem invariant violated')
			expect(err.message).toContain('subsystem: core')
		}

		const unreachable = new errors.UnreachableCodeError('unexpected_tag', 'unreachable branch', {
			metaMessages: ['subsystem: core'],
		})
		expect(unreachable).toBeInstanceOf(errors.BaseError)
		expect(unreachable.value).toBe('unexpected_tag')
		expect(unreachable.name).toBe('UnreachableCodeError')
		expect(unreachable.message).toContain('unreachable branch')
		expect(unreachable.message).toContain('subsystem: core')

		const bytesSize = new errors.InvalidBytesSizeError(20, 32, undefined, { metaMessages: ['subsystem: data'] })
		expect(bytesSize).toBeInstanceOf(errors.BaseError)
		expect(bytesSize.message).toContain('Expected 32, received 20')
		expect(bytesSize.message).toContain('subsystem: data')
	})

	it('preserves revert data on RevertError and plain JSON-RPC cause objects on ForkError', () => {
		const revert = new errors.RevertError('execution reverted', { raw: '0x08c379a0' })
		const wireRevert = JSON.parse(JSON.stringify({ code: revert.code, message: revert.shortMessage, data: revert.raw }))
		expect(wireRevert).toEqual({
			code: 3,
			message: 'execution reverted',
			data: '0x08c379a0',
		})

		// Regression test: ForkError must accept plain JSON-RPC { code, message } cause objects without throwing on abstract BaseError.
		const fork = new errors.ForkError('upstream RPC failed', {
			cause: { code: -32000, message: 'header not found' },
		})
		expect(fork).toBeInstanceOf(errors.BaseError)
		expect(fork.code).toBe(-32000)
		expect(fork.message).toContain('upstream RPC failed')
		expect(fork.message).toContain('header not found')
	})

	it('exposes complete rpcErrorCodeToMessage mappings for standard JSON-RPC and EIP-1474 codes', () => {
		expect(errors.rpcErrorCodeToMessage[-32700]).toBe('Parse error')
		expect(errors.rpcErrorCodeToMessage[-32600]).toBe('Invalid request')
		expect(errors.rpcErrorCodeToMessage[-32601]).toBe('Method not found')
		expect(errors.rpcErrorCodeToMessage[-32602]).toBe('Invalid params')
		expect(errors.rpcErrorCodeToMessage[-32603]).toBe('Internal error')
		expect(errors.rpcErrorCodeToMessage[3]).toBe('Execution reverted')
	})
})
