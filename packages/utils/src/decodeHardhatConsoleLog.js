import { decodeAbiParameters, toFunctionSelector } from 'viem'

/** Argument types used by `log(...)` overloads with one to four arguments. */
const LOG_TYPES = ['uint256', 'int256', 'string', 'bool', 'address']

/**
 * Build every canonical console signature mapped to the ABI types it decodes.
 * Old Hardhat `console.sol` releases hashed `uint`/`int` instead of `uint256`/`int256`,
 * so both spellings are registered for the same decoder.
 * @returns {Map<string, {signature: string; types: string[]}>}
 */
const buildSelectorTable = () => {
	/** @type {Array<{name: string; types: string[]}>} */
	const entries = [
		{ name: 'log', types: [] },
		{ name: 'logInt', types: ['int256'] },
		{ name: 'logUint', types: ['uint256'] },
		{ name: 'logString', types: ['string'] },
		{ name: 'logBool', types: ['bool'] },
		{ name: 'logAddress', types: ['address'] },
		{ name: 'logBytes', types: ['bytes'] },
		{ name: 'log', types: ['bytes'] },
	]
	for (let size = 1; size <= 32; size++) {
		entries.push({ name: `logBytes${size}`, types: [`bytes${size}`] })
		entries.push({ name: 'log', types: [`bytes${size}`] })
	}
	/** @type {string[][]} */
	let combos = [[]]
	for (let arity = 1; arity <= 4; arity++) {
		combos = combos.flatMap((prefix) => LOG_TYPES.map((type) => [...prefix, type]))
		for (const types of combos) entries.push({ name: 'log', types })
	}
	/** @type {Map<string, {signature: string; types: string[]}>} */
	const table = new Map()
	for (const { name, types } of entries) {
		const signature = `${name}(${types.join(',')})`
		table.set(toFunctionSelector(signature), { signature, types })
		const legacy = `${name}(${types.map((type) => type.replace(/^(u?int)256$/, '$1')).join(',')})`
		if (legacy !== signature) {
			const selector = toFunctionSelector(legacy)
			if (!table.has(selector)) table.set(selector, { signature, types })
		}
	}
	return table
}

/** @type {Map<string, {signature: string; types: string[]}> | undefined} */
let selectorTable

/**
 * Render one decoded console argument the way Hardhat prints it.
 * @param {unknown} value
 * @returns {string}
 */
const formatValue = (value) => (typeof value === 'bigint' ? value.toString() : String(value))

/**
 * Apply `util.format`-style `%s`, `%d`, `%i`, `%o` and `%%` substitution and append unused arguments.
 * @param {readonly unknown[]} args
 * @returns {string}
 */
const formatArgs = (args) => {
	const [first, ...rest] = args
	if (typeof first !== 'string') return args.map(formatValue).join(' ')
	let index = 0
	const head = first.replace(/%([sdio%])/g, (match, specifier) => {
		if (specifier === '%') return '%'
		if (index >= rest.length) return match
		const value = rest[index++]
		if (specifier === 's') return formatValue(value)
		if (specifier === 'o') return typeof value === 'string' ? `'${value}'` : formatValue(value)
		if (typeof value === 'bigint') return value.toString()
		if (typeof value === 'number') return Math.trunc(value).toString()
		return 'NaN'
	})
	return [head, ...rest.slice(index).map(formatValue)].join(' ')
}

/**
 * Decode calldata sent to Hardhat's console address (`HARDHAT_CONSOLE_ADDRESS`) by Hardhat `console.sol` or forge-std `console2.sol`.
 * Supports `log()`, the typed `logInt`/`logUint`/`logString`/`logBool`/`logAddress`/`logBytes`/`logBytes1`..`logBytes32`
 * helpers, `log(bytes)`, `log(bytes1..bytes32)`, and every `log` overload of one to four `uint256`, `int256`,
 * `string`, `bool` or `address` arguments. A leading string argument is treated as a format string.
 * @param {`0x${string}`} calldata Raw calldata including the 4-byte selector.
 * @returns {{formatted: string; args: readonly unknown[]; signature: string} | null} Null for an unknown selector or malformed arguments.
 * @example
 * import { decodeHardhatConsoleLog, encodeFunctionData, parseAbi } from '@tevm/utils'
 * const calldata = encodeFunctionData({
 *   abi: parseAbi(['function log(string,uint256)']),
 *   args: ['balance: %d', 42n],
 * })
 * console.log(decodeHardhatConsoleLog(calldata)?.formatted) // 'balance: 42'
 */
export const decodeHardhatConsoleLog = (calldata) => {
	if (typeof calldata !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(calldata) || calldata.length < 10) return null
	selectorTable ??= buildSelectorTable()
	const entry = selectorTable.get(/** @type {`0x${string}`} */ (calldata.slice(0, 10).toLowerCase()))
	if (!entry) return null
	try {
		const args = decodeAbiParameters(
			entry.types.map((type) => ({ type })),
			/** @type {`0x${string}`} */ (`0x${calldata.slice(10)}`),
		)
		return { formatted: formatArgs(args), args, signature: entry.signature }
	} catch {
		return null
	}
}
