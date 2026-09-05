import { all, logError } from 'effect/Effect'

/**
 * Logs all errors and causes from effect
 * @param {unknown} e
 * @returns {import("effect/Effect").Effect<void, never, never>}
 * @internal
 * @example
 * ```typescript
 * import { logAllErrors } from '@tevm/effect'
 * import { Effect } from 'effect'
 *
 * const program = Effect.fail(new Error('Unable to load configuration')).pipe(
 *   Effect.tapError(logAllErrors)
 * )
 * const result = await Effect.runPromiseExit(program)
 * console.log(result._tag) // 'Failure'
 * ```
 */
export const logAllErrors = (e) => {
	const errors = [e]
	let nextError = /** @type {Error} */ (e)
	while (nextError.cause) {
		errors.unshift(nextError.cause)
		nextError = /** @type {Error} */ (nextError.cause)
	}
	return all(errors.map((e) => logError(e)))
}
