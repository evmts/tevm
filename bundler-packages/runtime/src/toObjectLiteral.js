/**
 * Serializes JSON data as a JavaScript object literal.
 *
 * In an object literal, `"__proto__": value` sets the prototype instead of defining a key,
 * so a contract or NatSpec entry named `__proto__` would vanish or pollute the prototype.
 * Such keys are emitted as the computed key `['__proto__']`, which defines an own property.
 * Pretty-printed JSON places every key at the start of a line and escapes newlines in strings,
 * so a line that starts with `"__proto__":` is always a key.
 *
 * @param {unknown} value - JSON-serializable data
 * @returns {string} A JavaScript expression that evaluates to an equal value
 * @example
 * ```javascript
 * toObjectLiteral({ __proto__: null, ['__proto__']: 1 }) // "{\n  ['__proto__']: 1\n}"
 * ```
 * @internal
 */
export const toObjectLiteral = (value) =>
	String(JSON.stringify(value, null, 2)).replace(/^(\s*)"__proto__":/gm, "$1['__proto__']:")
