import { describe, expect, it } from 'vitest'
import { BaseError, InvalidParamsError } from '../ethereum/index.js'
import {
	InvalidAbiError,
	InvalidAddToBlockchainError,
	InvalidAddToMempoolError,
	InvalidArgsError,
	InvalidBalanceError,
	InvalidBlobVersionedHashesError,
	InvalidBlockError,
	InvalidBytecodeError,
	InvalidCallerError,
	InvalidDataError,
	InvalidDeployedBytecodeError,
	InvalidDepthError,
	InvalidFunctionNameError,
	InvalidGasLimitError,
	InvalidGasRefundError,
	InvalidMaxFeePerGasError,
	InvalidMaxPriorityFeePerGasError,
	InvalidNonceError,
	InvalidOriginError,
	InvalidSaltError,
	InvalidSelfdestructError,
	InvalidSkipBalanceError,
	InvalidStorageRootError,
	InvalidToError,
	InvalidUrlError,
	InvalidValueError,
} from './index.js'

const assertJsonRpcInvalidParamsWire = (error: BaseError, expectedMessage: string) => {
	const envelope = JSON.parse(
		JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			error: {
				code: error.code,
				message: error.shortMessage,
			},
		}),
	) as { jsonrpc: string; id: number; error: { code: number; message: string } }

	expect(envelope).toEqual({
		jsonrpc: '2.0',
		id: 1,
		error: {
			code: -32602,
			message: expectedMessage,
		},
	})
}

const assertInputErrorContract = (
	Ctor: new (message: string, args?: Record<string, unknown>) => InvalidParamsError,
	expectedName: string,
	sampleMessage: string,
	metaHint: string,
) => {
	const rootCause = new TypeError(`${expectedName} validation failed`)
	const error = new Ctor(sampleMessage, {
		cause: rootCause,
		details: `Validation details for ${expectedName}`,
		metaMessages: [metaHint],
	})

	expect(error).toBeInstanceOf(Error)
	expect(error).toBeInstanceOf(BaseError)
	expect(error).toBeInstanceOf(InvalidParamsError)
	expect(error).toBeInstanceOf(Ctor)
	expect(error.code).toBe(-32602)
	expect(error.name).toBe(expectedName)
	expect(error._tag).toBe(expectedName)
	expect(error.shortMessage).toBe(sampleMessage)
	expect(error.details).toBe(`Validation details for ${expectedName}`)
	expect(error.metaMessages).toEqual([metaHint])
	expect(error.cause).toBe(rootCause)
	expect(error.walk()).toBe(rootCause)
	expect(error.walk((candidate: unknown) => candidate instanceof TypeError)).toBe(rootCause)
	expect(error.message).toContain(sampleMessage)
	expect(error.message).toContain(metaHint)
	expect(error.message).toContain('https://tevm.sh')
	assertJsonRpcInvalidParamsWire(error, sampleMessage)

	const bare = new Ctor(sampleMessage)
	expect(bare.code).toBe(-32602)
	expect(bare.name).toBe(expectedName)
	expect(bare._tag).toBe(expectedName)
	expect(bare.cause).toBeUndefined()
	expect(bare.walk()).toBe(bare)
}

describe('Input parameter validation error classes (-32602)', () => {
	describe('InvalidAbiError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(InvalidAbiError, 'InvalidAbiError', 'ABI must be a valid JSON ABI array', 'Field: abi')
		})
	})

	describe('InvalidAddToBlockchainError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidAddToBlockchainError,
				'InvalidAddToBlockchainError',
				'addToBlockchain must be a boolean',
				'Field: addToBlockchain',
			)
		})
	})

	describe('InvalidAddToMempoolError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidAddToMempoolError,
				'InvalidAddToMempoolError',
				'addToMempool must be a boolean',
				'Field: addToMempool',
			)
		})
	})

	describe('InvalidArgsError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidArgsError,
				'InvalidArgsError',
				'Function args must match ABI input arity',
				'Field: args',
			)
		})
	})

	describe('InvalidBalanceError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidBalanceError,
				'InvalidBalanceError',
				'Account balance must be a non-negative bigint',
				'Field: balance',
			)
		})
	})

	describe('InvalidBlobVersionedHashesError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidBlobVersionedHashesError,
				'InvalidBlobVersionedHashesError',
				'blobVersionedHashes entries must be 32-byte hex values starting with 0x01',
				'Field: blobVersionedHashes',
			)
		})
	})

	describe('InvalidBlockError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidBlockError,
				'InvalidBlockError',
				'Block tag must be a valid tag, block number, or 32-byte hash',
				'Field: blockTag',
			)
		})
	})

	describe('InvalidBytecodeError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidBytecodeError,
				'InvalidBytecodeError',
				'Creation bytecode must be 0x-prefixed even-length hex',
				'Field: bytecode',
			)
		})
	})

	describe('InvalidCallerError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidCallerError,
				'InvalidCallerError',
				'Caller must be a valid 20-byte Ethereum address',
				'Field: caller',
			)
		})
	})

	describe('InvalidDataError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidDataError,
				'InvalidDataError',
				'Calldata must be valid 0x-prefixed hex',
				'Field: data',
			)
		})
	})

	describe('InvalidDeployedBytecodeError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidDeployedBytecodeError,
				'InvalidDeployedBytecodeError',
				'Deployed bytecode must be valid 0x-prefixed hex',
				'Field: deployedBytecode',
			)
		})
	})

	describe('InvalidDepthError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidDepthError,
				'InvalidDepthError',
				'Call depth must be a non-negative integer <= 1024',
				'Field: depth',
			)
		})
	})

	describe('InvalidFunctionNameError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidFunctionNameError,
				'InvalidFunctionNameError',
				'Function name must exist in the supplied ABI',
				'Field: functionName',
			)
		})
	})

	describe('InvalidGasLimitError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidGasLimitError,
				'InvalidGasLimitError',
				'Gas limit must be a positive bigint',
				'Field: gas',
			)
		})
	})

	describe('InvalidGasRefundError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidGasRefundError,
				'InvalidGasRefundError',
				'Gas refund counter must be a non-negative bigint',
				'Field: gasRefund',
			)
		})
	})

	describe('InvalidMaxFeePerGasError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidMaxFeePerGasError,
				'InvalidMaxFeePerGasError',
				'maxFeePerGas must be a non-negative bigint',
				'Field: maxFeePerGas',
			)
		})
	})

	describe('InvalidMaxPriorityFeePerGasError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidMaxPriorityFeePerGasError,
				'InvalidMaxPriorityFeePerGasError',
				'maxPriorityFeePerGas must not exceed maxFeePerGas',
				'Field: maxPriorityFeePerGas',
			)
		})
	})

	describe('InvalidNonceError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidNonceError,
				'InvalidNonceError',
				'Nonce must be a non-negative bigint',
				'Field: nonce',
			)
		})
	})

	describe('InvalidOriginError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidOriginError,
				'InvalidOriginError',
				'Origin must be a valid 20-byte Ethereum address',
				'Field: origin',
			)
		})
	})

	describe('InvalidSaltError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidSaltError,
				'InvalidSaltError',
				'CREATE2 salt must be a 32-byte hex string',
				'Field: salt',
			)
		})
	})

	describe('InvalidSelfdestructError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidSelfdestructError,
				'InvalidSelfdestructError',
				'Selfdestruct set must contain valid Ethereum addresses',
				'Field: selfdestruct',
			)
		})
	})

	describe('InvalidSkipBalanceError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidSkipBalanceError,
				'InvalidSkipBalanceError',
				'skipBalance must be a boolean',
				'Field: skipBalance',
			)
		})
	})

	describe('InvalidStorageRootError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidStorageRootError,
				'InvalidStorageRootError',
				'storageRoot must be a 32-byte hex hash',
				'Field: storageRoot',
			)
		})
	})

	describe('InvalidToError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidToError,
				'InvalidToError',
				'to address must be a 20-byte hex address',
				'Field: to',
			)
		})
	})

	describe('InvalidUrlError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidUrlError,
				'InvalidUrlError',
				'Fork RPC URL must use http, https, ws, or wss scheme',
				'Field: url',
			)
		})
	})

	describe('InvalidValueError', () => {
		it('enforces -32602 wire contract, inheritance, and cause chain', () => {
			assertInputErrorContract(
				InvalidValueError,
				'InvalidValueError',
				'Transaction value must be a non-negative bigint',
				'Field: value',
			)
		})
	})

	describe('Cross-cutting input error edge cases', () => {
		it('supports custom docsBaseUrl and docsPath overrides on subclasses', () => {
			const error = createInvalidToOverrideError()
			expect(error.code).toBe(-32602)
			expect(error.message).toContain('https://node.tevm.sh/api/json-rpc')
		})

		it('distinguishes each input error class cleanly via instanceof', () => {
			const abiErr = new InvalidAbiError('bad abi')
			const argsErr = new InvalidArgsError('bad args')
			const urlErr = new InvalidUrlError('bad url')
			expect(abiErr).toBeInstanceOf(InvalidAbiError)
			expect(abiErr).not.toBeInstanceOf(InvalidArgsError)
			expect(argsErr).toBeInstanceOf(InvalidArgsError)
			expect(argsErr).not.toBeInstanceOf(InvalidUrlError)
			expect(urlErr).toBeInstanceOf(InvalidUrlError)
			expect(urlErr).not.toBeInstanceOf(InvalidAbiError)
		})
	})
})

function createInvalidToOverrideError() {
	return new InvalidToError('Invalid recipient address', {
		docsBaseUrl: 'https://node.tevm.sh',
		docsPath: '/api/json-rpc',
	})
}
