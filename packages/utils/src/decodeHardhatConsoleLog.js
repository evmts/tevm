import { decodeAbiParameters, hexToBytes, toFunctionSelector } from 'viem'

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
		const entry = { signature, types }
		table.set(toFunctionSelector(signature), entry)
		const legacy = `${name}(${types.map((type) => type.replace(/^(u?int)256$/, '$1')).join(',')})`
		const legacySelector = toFunctionSelector(legacy)
		if (!table.has(legacySelector)) table.set(legacySelector, entry)
	}
	return table
}

/** @type {Map<string, {signature: string; types: string[]}> | undefined} */
let selectorTable

const utf8 = new TextDecoder('utf-8', { ignoreBOM: true })

/**
 * Render one decoded console argument the way Hardhat prints it.
 * @param {unknown} value
 * @returns {string}
 */
const formatValue = (value) => (typeof value === 'bigint' ? value.toString() : String(value))

/**
 * Render a `%d`, `%i` or `%f` argument with the coercion Node's `util.format` applies to strings:
 * `%d` uses `Number`, `%i` uses `parseInt` and `%f` uses `parseFloat`. Integers decode as bigint and print exactly.
 * @param {string} specifier One of `d`, `i` or `f`.
 * @param {unknown} value
 * @returns {string}
 */
const formatNumeric = (specifier, value) => {
	if (typeof value === 'bigint') return value.toString()
	if (typeof value !== 'number' && typeof value !== 'string') return 'NaN'
	/** @type {number} */
	let number
	if (specifier === 'd') number = Number(value)
	// biome-ignore lint/correctness/useParseIntRadix: util.format calls parseInt without a radix, so "0x10" prints 16.
	else if (specifier === 'i') number = Number.parseInt(String(value))
	else number = Number.parseFloat(String(value))
	return Object.is(number, -0) ? '-0' : String(number)
}

/**
 * Apply `util.format`-style `%s`, `%d`, `%i`, `%f`, `%o` and `%%` substitution and append unused arguments.
 * As in `util.format`, a format string with no further arguments is returned unchanged, so `%%` stays `%%`.
 * @param {readonly unknown[]} args
 * @returns {string}
 */
const formatArgs = (args) => {
	const [first, ...rest] = args
	if (typeof first !== 'string') return args.map(formatValue).join(' ')
	if (rest.length === 0) return first
	let index = 0
	const head = first.replace(/%([sdifo%])/g, (match, specifier) => {
		if (specifier === '%') return '%'
		if (index >= rest.length) return match
		const value = rest[index++]
		if (specifier === 's') return formatValue(value)
		if (specifier === 'o') return typeof value === 'string' ? `'${value}'` : formatValue(value)
		return formatNumeric(specifier, value)
	})
	return [head, ...rest.slice(index).map(formatValue)].join(' ')
}

/**
 * Decode calldata sent to Hardhat's console address (`HARDHAT_CONSOLE_ADDRESS`) by Hardhat `console.sol` or forge-std `console2.sol`.
 * Supports `log()`, the typed `logInt`/`logUint`/`logString`/`logBool`/`logAddress`/`logBytes`/`logBytes1`..`logBytes32`
 * helpers, `log(bytes)`, `log(bytes1..bytes32)`, and every `log` overload of one to four `uint256`, `int256`,
 * `string`, `bool` or `address` arguments. A leading string argument followed by more arguments is a
 * `util.format` format string; a lone string is printed unchanged.
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
		// ABI strings have the wire layout of bytes. Decode their exact length until
		// viem's string decoder preserves leading NULs and the U+FEFF code point.
		const values = decodeAbiParameters(
			entry.types.map((type) => ({ type: type === 'string' ? 'bytes' : type })),
			/** @type {`0x${string}`} */ (`0x${calldata.slice(10)}`),
		)
		const args = values.map((value, i) =>
			entry.types[i] === 'string' ? utf8.decode(hexToBytes(/** @type {`0x${string}`} */ (value))) : value,
		)
		return { formatted: formatArgs(args), args, signature: entry.signature }
	} catch {
		return null
	}
}
