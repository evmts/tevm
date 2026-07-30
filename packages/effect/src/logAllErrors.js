import { all, logError } from 'effect/Effect'

/**
 * Logs all errors and causes from effect
 * @param {unknown} e
 * @returns {import("effect/Effect").Effect<void, never, never>}
 * @internal
 * @example
 * ```typescript
 * import { fail, runPromise, tapError } from 'effect/Effect'
 * import { logAllErrors } from '@tevm/effect'
 *
 * const someEffect = fail(new Error('Something went wrong'))
 *
 * await runPromise(
 *   someEffect.pipe(
 *     tapError(logAllErrors)
 *   )
 * ).catch(() => console.log('error was logged'))
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
