import { describe, expect, it } from 'vitest'
import {
	AccountLockedError,
	AccountNotFoundError,
	BaseError,
	BlobGasLimitExceededError,
	BlockGasLimitExceededError,
	ChainIdMismatchError,
	ContractExecutionFailedError,
	ExecutionError,
	GasLimitExceededError,
	InsufficientFundsError,
	InsufficientPermissionsError,
	InternalError,
	InvalidAddressError,
	InvalidGasPriceError,
	InvalidParamsError,
	InvalidRequestError,
	InvalidSignatureError,
	InvalidTransactionError,
	LimitExceededError,
	MethodNotFoundError,
	MethodNotSupportedError,
	NonceAlreadyUsedError,
	NonceTooHighError,
	NonceTooLowError,
	NoSignerAvailableError,
	ParseError,
	PendingTransactionTimeoutError,
	RateLimitExceededError,
	ResourceNotFoundError,
	ResourceUnavailableError,
	RevertError,
	TransactionRejectedError,
	TransactionTooLargeError,
	TransactionUnderpricedError,
	UnknownBlockError,
	UnsupportedChainError,
} from './index.js'

const toJsonRpcErrorEnvelope = (error: BaseError) => {
	const wire = {
		jsonrpc: '2.0',
		id: 1,
		error: {
			code: error.code,
			message: error.shortMessage,
		},
	}
	return JSON.parse(JSON.stringify(wire)) as typeof wire
}

describe('Ethereum JSON-RPC 2.0 core error classes', () => {
	describe('ParseError (-32700)', () => {
		it('sets canonical JSON-RPC code, tag, docs path, and wire payload', () => {
			const error = new ParseError('Malformed JSON payload at byte 12')
			expect(error).toBeInstanceOf(Error)
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32700)
			expect(ParseError.code).toBe(-32700)
			expect(error._tag).toBe('ParseError')
			expect(error.name).toBe('ParseError')
			expect(error.shortMessage).toBe('Malformed JSON payload at byte 12')
			expect(error.message).toContain('Malformed JSON payload at byte 12')
			expect(error.message).toContain('https://tevm.sh/reference/tevm/errors/classes/parseerror/')
			const envelope = toJsonRpcErrorEnvelope(error)
			expect(envelope).toEqual({
				jsonrpc: '2.0',
				id: 1,
				error: { code: -32700, message: 'Malformed JSON payload at byte 12' },
			})
		})

		it('preserves cause chain and metaMessages through walk()', () => {
			const rootCause = new SyntaxError('Unexpected token }')
			const error = new ParseError('Could not parse JSON-RPC body', {
				cause: rootCause,
				metaMessages: ['Body length: 64 bytes'],
				details: 'Unexpected token }',
			})
			expect(error.cause).toBe(rootCause)
			expect(error.walk()).toBe(rootCause)
			expect(error.walk((candidate) => candidate instanceof SyntaxError)).toBe(rootCause)
			expect(error.metaMessages).toEqual(['Body length: 64 bytes'])
			expect(error.message).toContain('Body length: 64 bytes')
		})

		it('supports custom tag override', () => {
			const error = new ParseError('Custom parse failure', {}, 'CustomParseTag')
			expect(error._tag).toBe('CustomParseTag')
			expect(error.name).toBe('CustomParseTag')
		})
	})

	describe('InvalidRequestError (-32600)', () => {
		it('sets canonical JSON-RPC code, tag, docs path, and wire payload', () => {
			const error = new InvalidRequestError('Missing jsonrpc version field')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32600)
			expect(InvalidRequestError.code).toBe(-32600)
			expect(error._tag).toBe('InvalidRequest')
			expect(error.name).toBe('InvalidRequest')
			expect(error.message).toContain('/reference/tevm/errors/classes/invalidrequesterror/')
			expect(toJsonRpcErrorEnvelope(error)).toEqual({
				jsonrpc: '2.0',
				id: 1,
				error: { code: -32600, message: 'Missing jsonrpc version field' },
			})
		})

		it('supports nested BaseError cause traversal', () => {
			const inner = new ParseError('Bad frame')
			const outer = new InvalidRequestError('Request envelope invalid', { cause: inner })
			expect(outer.walk((e) => e instanceof ParseError)).toBe(inner)
			expect(outer.walk()).toBe(inner)
		})
	})

	describe('MethodNotFoundError (-32601)', () => {
		it('sets canonical JSON-RPC code, tag, docs path, and wire payload', () => {
			const error = new MethodNotFoundError('Method eth_unknown does not exist')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32601)
			expect(MethodNotFoundError.code).toBe(-32601)
			expect(error._tag).toBe('MethodNotFound')
			expect(error.name).toBe('MethodNotFound')
			expect(error.message).toContain('/reference/tevm/errors/classes/methodnotfounderror/')
			expect(toJsonRpcErrorEnvelope(error)).toEqual({
				jsonrpc: '2.0',
				id: 1,
				error: { code: -32601, message: 'Method eth_unknown does not exist' },
			})
		})

		it('includes metaMessages and custom details when supplied', () => {
			const error = new MethodNotFoundError('Unknown RPC method', {
				metaMessages: ['Requested method: debug_traceBlockByHash'],
				details: 'Method is not registered on the active dispatcher',
			})
			expect(error.details).toBe('Method is not registered on the active dispatcher')
			expect(error.message).toContain('Requested method: debug_traceBlockByHash')
		})
	})

	describe('InvalidParamsError (-32602)', () => {
		it('sets canonical JSON-RPC code, tag, docs path, and wire payload', () => {
			const error = new InvalidParamsError('Expected hex quantity for block parameter')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32602)
			expect(InvalidParamsError.code).toBe(-32602)
			expect(error._tag).toBe('InvalidParams')
			expect(error.name).toBe('InvalidParams')
			expect(error.message).toContain('/reference/tevm/errors/classes/invalidparamserror/')
			expect(toJsonRpcErrorEnvelope(error)).toEqual({
				jsonrpc: '2.0',
				id: 1,
				error: { code: -32602, message: 'Expected hex quantity for block parameter' },
			})
		})

		it('supports custom tag and cause propagation', () => {
			const cause = new RangeError('Block number cannot be negative')
			const error = new InvalidParamsError('Invalid block parameter', { cause }, 'BlockParamError')
			expect(error._tag).toBe('BlockParamError')
			expect(error.walk()).toBe(cause)
		})
	})

	describe('InternalError (-32603)', () => {
		it('sets canonical JSON-RPC code, tag, docs path, and wire payload', () => {
			const error = new InternalError('Unexpected state root mismatch')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32603)
			expect(InternalError.code).toBe(-32603)
			expect(error._tag).toBe('InternalError')
			expect(error.name).toBe('InternalError')
			expect(error.message).toContain('/reference/tevm/errors/classes/internalerror/')
			expect(toJsonRpcErrorEnvelope(error)).toEqual({
				jsonrpc: '2.0',
				id: 1,
				error: { code: -32603, message: 'Unexpected state root mismatch' },
			})
		})

		it('walks multi-level error chains cleanly', () => {
			const leaf = new Error('disk full')
			const mid = new ResourceUnavailableError('state db busy', { cause: leaf })
			const top = new InternalError('node commit failed', { cause: mid })
			expect(top.walk()).toBe(leaf)
			expect(top.walk((e) => e instanceof ResourceUnavailableError)).toBe(mid)
		})
	})
})

describe('EIP-1474 and EVM execution error classes', () => {
	describe('RevertError (3)', () => {
		it('sets EIP-1474 execution revert code 3 and optional raw revert bytes', () => {
			const raw = '0x08c379a00000000000000000000000000000000000000000000000000000000000000020' as const
			const error = new RevertError('ERC20: transfer amount exceeds balance', { raw })
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(3)
			expect(RevertError.code).toBe(3)
			expect(error._tag).toBe('Revert')
			expect(error.name).toBe('Revert')
			expect(error.raw).toBe(raw)
			expect(error.message).toContain('/reference/tevm/errors/classes/reverterror/')
			expect(toJsonRpcErrorEnvelope(error)).toEqual({
				jsonrpc: '2.0',
				id: 1,
				error: { code: 3, message: 'ERC20: transfer amount exceeds balance' },
			})
		})

		it('leaves raw undefined when no revert data is supplied', () => {
			const error = new RevertError('Execution reverted without reason')
			expect(error.raw).toBeUndefined()
			expect(error.code).toBe(3)
		})
	})

	describe('ExecutionError (-32015)', () => {
		it('sets VM execution code -32015 and preserves cause', () => {
			const cause = new Error('invalid opcode 0xfe')
			const error = new ExecutionError('EVM halted with invalid opcode', { cause })
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32015)
			expect(ExecutionError.code).toBe(-32015)
			expect(error._tag).toBe('ExecutionError')
			expect(error.walk()).toBe(cause)
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32015)
		})
	})

	describe('ContractExecutionFailedError (-32015)', () => {
		it('sets VM execution code -32015 and tag ContractExecutionFailed', () => {
			const error = new ContractExecutionFailedError('Contract call ran out of gas', {
				metaMessages: ['Gas limit: 21000'],
			})
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32015)
			expect(ContractExecutionFailedError.code).toBe(-32015)
			expect(error._tag).toBe('ContractExecutionFailed')
			expect(error.name).toBe('ContractExecutionFailed')
			expect(error.message).toContain('Gas limit: 21000')
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32015)
		})
	})

	describe('ResourceNotFoundError (-32001) and subclasses', () => {
		it('sets code -32001 on ResourceNotFoundError', () => {
			const error = new ResourceNotFoundError('Filter 0x1 not found')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32001)
			expect(ResourceNotFoundError.code).toBe(-32001)
			expect(error._tag).toBe('ResourceNotFound')
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32001)
		})

		it('inherits code -32001 on AccountNotFoundError', () => {
			const error = new AccountNotFoundError('Account 0x000000000000000000000000000000000000dead not found')
			expect(error).toBeInstanceOf(BaseError)
			expect(error).toBeInstanceOf(ResourceNotFoundError)
			expect(error).toBeInstanceOf(AccountNotFoundError)
			expect(error.code).toBe(-32001)
			expect(error._tag).toBe('AccountNotFound')
			expect(error.name).toBe('AccountNotFound')
			expect(error.message).toContain('/reference/tevm/errors/classes/accountnotfounderror/')
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32001)
		})

		it('sets code -32001 on UnknownBlockError', () => {
			const error = new UnknownBlockError('Block 0x999999 does not exist')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32001)
			expect(UnknownBlockError.code).toBe(-32001)
			expect(error._tag).toBe('UnknownBlock')
			expect(error.name).toBe('UnknownBlock')
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32001)
		})
	})

	describe('ResourceUnavailableError (-32002) and PendingTransactionTimeoutError (-32002)', () => {
		it('sets code -32002 on ResourceUnavailableError', () => {
			const error = new ResourceUnavailableError('Fork upstream is unreachable')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32002)
			expect(ResourceUnavailableError.code).toBe(-32002)
			expect(error._tag).toBe('ResourceUnavailable')
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32002)
		})

		it('sets code -32002 on PendingTransactionTimeoutError', () => {
			const error = new PendingTransactionTimeoutError('Transaction 0xabc stayed pending for 30s')
			expect(error).toBeInstanceOf(BaseError)
			expect(error.code).toBe(-32002)
			expect(PendingTransactionTimeoutError.code).toBe(-32002)
			expect(error._tag).toBe('PendingTransactionTimeout')
			expect(error.name).toBe('PendingTransactionTimeout')
			expect(toJsonRpcErrorEnvelope(error).error.code).toBe(-32002)
		})
	})

	describe('Transaction admission and nonce errors (-32003, -32006, -32008, -32011, -32012, -32014)', () => {
		const admissionCases = [
			{
				label: 'TransactionRejectedError',
				Ctor: TransactionRejectedError,
				expectedCode: -32003,
				expectedTag: 'TransactionRejected',
				msg: 'Transaction rejected by mempool policy',
			},
			{
				label: 'InvalidTransactionError',
				Ctor: InvalidTransactionError,
				expectedCode: -32003,
				expectedTag: 'InvalidTransaction',
				msg: 'RLP transaction decoding failed',
			},
			{
				label: 'InsufficientFundsError',
				Ctor: InsufficientFundsError,
				expectedCode: -32003,
				expectedTag: 'InsufficientFunds',
				msg: 'Sender balance is lower than gas * price + value',
			},
			{
				label: 'GasLimitExceededError',
				Ctor: GasLimitExceededError,
				expectedCode: -32003,
				expectedTag: 'GasLimitExceeded',
				msg: 'Transaction gas limit exceeds block cap',
			},
			{
				label: 'BlobGasLimitExceededError',
				Ctor: BlobGasLimitExceededError,
				expectedCode: -32003,
				expectedTag: 'BlobGasLimitExceededError',
				msg: 'Blob gas exceeds EIP-4844 target ceiling',
			},
			{
				label: 'NonceTooLowError',
				Ctor: NonceTooLowError,
				expectedCode: -32003,
				expectedTag: 'NonceTooLow',
				msg: 'Nonce 2 is lower than account nonce 5',
			},
			{
				label: 'NonceTooHighError',
				Ctor: NonceTooHighError,
				expectedCode: -32003,
				expectedTag: 'NonceTooHigh',
				msg: 'Nonce 99 exceeds next expected nonce 5',
			},
			{
				label: 'BlockGasLimitExceededError',
				Ctor: BlockGasLimitExceededError,
				expectedCode: -32006,
				expectedTag: 'BlockGasLimitExceeded',
				msg: 'Block gas limit of 30000000 reached',
			},
			{
				label: 'NonceAlreadyUsedError',
				Ctor: NonceAlreadyUsedError,
				expectedCode: -32008,
				expectedTag: 'NonceAlreadyUsed',
				msg: 'Nonce 4 has already been mined',
			},
			{
				label: 'TransactionTooLargeError',
				Ctor: TransactionTooLargeError,
				expectedCode: -32011,
				expectedTag: 'TransactionTooLarge',
				msg: 'Serialized transaction exceeds 128 KiB limit',
			},
			{
				label: 'InvalidGasPriceError',
				Ctor: InvalidGasPriceError,
				expectedCode: -32012,
				expectedTag: 'InvalidGasPrice',
				msg: 'Max fee per gas is below base fee',
			},
			{
				label: 'TransactionUnderpricedError',
				Ctor: TransactionUnderpricedError,
				expectedCode: -32014,
				expectedTag: 'TransactionUnderpriced',
				msg: 'Replacement transaction requires 10% fee bump',
			},
		] as const

		for (const { label, Ctor, expectedCode, expectedTag, msg } of admissionCases) {
			it(`${label} encodes exact wire code ${expectedCode} and tag ${expectedTag}`, () => {
				const cause = new Error(`${label} underlying cause`)
				const error = new Ctor(msg, {
					cause,
					metaMessages: [`Case: ${label}`],
				})
				expect(error).toBeInstanceOf(BaseError)
				expect(error.code).toBe(expectedCode)
				expect(Ctor.code).toBe(expectedCode)
				expect(error._tag).toBe(expectedTag)
				expect(error.name).toBe(expectedTag)
				expect(error.shortMessage).toBe(msg)
				expect(error.walk()).toBe(cause)
				expect(error.message).toContain(`Case: ${label}`)
				const wire = toJsonRpcErrorEnvelope(error)
				expect(wire).toEqual({
					jsonrpc: '2.0',
					id: 1,
					error: { code: expectedCode, message: msg },
				})
			})
		}
	})

	describe('Access, capability, chain, and signature errors', () => {
		const capabilityCases = [
			{
				label: 'MethodNotSupportedError',
				Ctor: MethodNotSupportedError,
				expectedCode: -32004,
				expectedTag: 'MethodNotSupported',
				msg: 'Method eth_sign is disabled on this node',
			},
			{
				label: 'LimitExceededError',
				Ctor: LimitExceededError,
				expectedCode: -32005,
				expectedTag: 'LimitExceeded',
				msg: 'Batch size exceeds 100 requests',
			},
			{
				label: 'RateLimitExceededError',
				Ctor: RateLimitExceededError,
				expectedCode: -32005,
				expectedTag: 'RateLimitExceeded',
				msg: 'Client exceeded 50 requests per second',
			},
			{
				label: 'UnsupportedChainError',
				Ctor: UnsupportedChainError,
				expectedCode: -32007,
				expectedTag: 'UnsupportedChain',
				msg: 'Chain ID 999999 is not configured',
			},
			{
				label: 'InsufficientPermissionsError',
				Ctor: InsufficientPermissionsError,
				expectedCode: -32009,
				expectedTag: 'InsufficientPermissions',
				msg: 'Admin namespace requires trusted local socket',
			},
			{
				label: 'InvalidAddressError',
				Ctor: InvalidAddressError,
				expectedCode: -32013,
				expectedTag: 'InvalidAddress',
				msg: 'Address must be 20 bytes hex',
			},
			{
				label: 'AccountLockedError',
				Ctor: AccountLockedError,
				expectedCode: -32020,
				expectedTag: 'AccountLocked',
				msg: 'Signer account is locked',
			},
			{
				label: 'ChainIdMismatchError',
				Ctor: ChainIdMismatchError,
				expectedCode: -32000,
				expectedTag: 'ChainIdMismatch',
				msg: 'Signed chainId 1 does not match node chainId 31337',
			},
			{
				label: 'InvalidSignatureError',
				Ctor: InvalidSignatureError,
				expectedCode: -32000,
				expectedTag: 'InvalidSignature',
				msg: 'Failed ecrecover for transaction signature',
			},
			{
				label: 'NoSignerAvailableError',
				Ctor: NoSignerAvailableError,
				expectedCode: -32000,
				expectedTag: 'NoSignerAvailable',
				msg: 'No impersonated or unlocked signer available for sender',
			},
		] as const

		for (const { label, Ctor, expectedCode, expectedTag, msg } of capabilityCases) {
			it(`${label} preserves exact code ${expectedCode}, tag ${expectedTag}, and custom overrides`, () => {
				const error = new Ctor(msg, {
					details: `Detail for ${label}`,
					metaMessages: [`Meta for ${label}`],
				})
				expect(error).toBeInstanceOf(BaseError)
				expect(error.code).toBe(expectedCode)
				expect(Ctor.code).toBe(expectedCode)
				expect(error._tag).toBe(expectedTag)
				expect(error.name).toBe(expectedTag)
				expect(error.details).toBe(`Detail for ${label}`)
				expect(error.message).toContain(`Meta for ${label}`)
				expect(toJsonRpcErrorEnvelope(error)).toEqual({
					jsonrpc: '2.0',
					id: 1,
					error: { code: expectedCode, message: msg },
				})

				const custom = new Ctor(msg, {}, `${label}Override`)
				expect(custom._tag).toBe(`${label}Override`)
				expect(custom.name).toBe(`${label}Override`)
			})
		}
	})
})
