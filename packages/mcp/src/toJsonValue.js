/**
 * Converts Tevm and viem values into JSON-safe data without losing integer precision.
 *
 * @param {unknown} value - Any value returned by Tevm, viem, or solc.
 * @returns {unknown} A JSON-safe value.
 *
 * @example
 * ```js
 * import { toJsonValue } from '@tevm/mcp'
 *
 * console.log(toJsonValue({ gasUsed: 21000n }))
 * // { gasUsed: "21000" }
 * ```
 */
export const toJsonValue = (value) => {
	if (typeof value === 'bigint') {
		return value.toString()
	}
	if (value instanceof Uint8Array) {
		return `0x${Buffer.from(value).toString('hex')}`
	}
	if (value instanceof Set) {
		return Array.from(value, toJsonValue)
	}
	if (value instanceof Map) {
		return Object.fromEntries(Array.from(value, ([key, item]) => [String(key), toJsonValue(item)]))
	}
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			...(value.cause ? { cause: toJsonValue(value.cause) } : {}),
		}
	}
	if (Array.isArray(value)) {
		return value.map(toJsonValue)
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonValue(item)]))
	}
	return value
}
