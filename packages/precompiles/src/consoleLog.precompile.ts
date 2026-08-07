import { createAddress } from '@tevm/address'
import {
	type AbiParameter,
	bytesToHex,
	decodeAbiParameters,
	getAddress,
	type Hex,
	toFunctionSelector,
} from '@tevm/utils'

/**
 * Receives the formatted arguments from a Hardhat or forge-std console log call.
 */
export type ConsoleLogHandler = (args: unknown[]) => void

/**
 * The address used by Hardhat and forge-std console logging libraries.
 */
export const CONSOLE_LOG_ADDRESS = createAddress('0x000000000000000000636F6e736F6c652e6c6f67')

const LOG_TYPES = ['uint256', 'string', 'bool', 'address'] as const
const EMPTY_RESULT = {
	returnValue: new Uint8Array(),
	executionGasUsed: 0n,
}

const createConsoleLogSignatures = () => {
	const signatures = new Map<Hex, readonly AbiParameter[]>()

	/** @param {string} name */
	const register = (name: string, types: readonly AbiParameter['type'][]) => {
		const parameters = types.map((type) => ({ type })) as readonly AbiParameter[]
		signatures.set(toFunctionSelector(`${name}(${types.join(',')})`), parameters)
	}

	register('log', [])

	const registerLogCombinations = (types: readonly AbiParameter['type'][]) => {
		if (types.length > 0) register('log', types)
		if (types.length === 4) return
		for (const type of LOG_TYPES) {
			registerLogCombinations([...types, type])
		}
	}
	registerLogCombinations([])

	register('log', ['bytes'])
	register('log', ['int256'])
	for (let size = 1; size <= 32; size++) {
		register('log', [`bytes${size}` as AbiParameter['type']])
	}

	register('logInt', ['int256'])
	register('logUint', ['uint256'])
	register('logString', ['string'])
	register('logBool', ['bool'])
	register('logAddress', ['address'])
	register('logBytes', ['bytes'])
	for (let size = 1; size <= 32; size++) {
		const type = `bytes${size}` as AbiParameter['type']
		register(`logBytes${size}`, [type])
	}

	// Older Hardhat releases hashed the non-canonical int/uint aliases literally.
	signatures.set(toFunctionSelector('log(int)'), [{ type: 'int256' }])
	signatures.set(toFunctionSelector('log(uint)'), [{ type: 'uint256' }])

	return signatures
}

const consoleLogSignatures = createConsoleLogSignatures()

const formatArgument = (value: unknown, parameter: AbiParameter) => {
	if (parameter.type.startsWith('uint') || parameter.type.startsWith('int')) {
		return typeof value === 'bigint' ? value.toString() : value
	}
	if (parameter.type === 'address' && typeof value === 'string') {
		return getAddress(value)
	}
	return value
}

/**
 * Creates a zero-gas precompile that handles calls emitted by Hardhat's `console.sol`
 * and forge-std's `console.sol` and `console2.sol`.
 *
 * Invalid calldata and handler errors are intentionally ignored because the Solidity
 * console libraries are debugging helpers and must not change EVM execution.
 *
 * @param options - Optional log handler configuration.
 * @returns A custom EVM precompile at the shared console address.
 * @example
 * ```ts
 * import { consoleLogPrecompile } from '@tevm/precompiles'
 *
 * const precompile = consoleLogPrecompile({
 *   onLog: (args) => console.log('Solidity:', ...args),
 * })
 * ```
 */
export const consoleLogPrecompile = ({
	onLog = (args: unknown[]) => console.log(...args),
}: {
	onLog?: ConsoleLogHandler
} = {}) => ({
	address: CONSOLE_LOG_ADDRESS,
	function: ({ data }: { data: Uint8Array }) => {
		try {
			if (data.length < 4) return EMPTY_RESULT
			const parameters = consoleLogSignatures.get(bytesToHex(data.slice(0, 4)))
			if (parameters === undefined) return EMPTY_RESULT
			const decoded = decodeAbiParameters(parameters, data.slice(4))
			onLog(decoded.map((value, index) => formatArgument(value, parameters[index] as AbiParameter)))
		} catch (_error) {
			// Console logging is best-effort and must never alter contract execution.
		}
		return EMPTY_RESULT
	},
})
