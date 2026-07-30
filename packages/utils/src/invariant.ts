import { DefensiveNullCheckError } from '@tevm/errors'

/**
 * Asserts that a condition is truthy, throwing otherwise.
 * Narrows the type of the condition via a TypeScript assertion signature.
 * @param condition - The condition to check
 * @param error - The error to throw if the condition is falsy. Defaults to a {@link DefensiveNullCheckError}
 * @throws {DefensiveNullCheckError} If the condition is falsy and no error is provided
 * @throws {Error} The provided error if the condition is falsy
 * @example
 * ```typescript
 * import { invariant } from '@tevm/utils'
 *
 * const value: string | undefined = 'hello'
 * invariant(value !== undefined, new Error('value must be defined'))
 * // value is now narrowed to string
 * console.log(value.toUpperCase())
 * ```
 */
export function invariant(condition: any, error: Error = new DefensiveNullCheckError()): asserts condition {
	if (!condition) {
		throw error
	}
}
