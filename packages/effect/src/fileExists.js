import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { flatMap, logDebug, promise, tap } from 'effect/Effect'

/**
 * Checks if a file exists at the given path
 * @param {string} path - path to check
 * @returns {import("effect/Effect").Effect<boolean, never, never>} true if the file exists, false otherwise
 * @example
 * ```typescript
 * import { runPromise } from 'effect/Effect'
 * import { fileExists } from '@tevm/effect'
 *
 * const exists = await runPromise(fileExists('./someFile.txt'))
 * console.log(exists) // true or false
 * ```
 * @internal
 */
export const fileExists = (path) => {
	return logDebug(`fileExists: Checking if file exists at path: ${path}`).pipe(
		flatMap(() =>
			promise(() =>
				access(path, constants.F_OK)
					.then(() => true)
					.catch(() => false),
			),
		),
		tap((exists) => logDebug(`fileExists: ${path}: ${exists}`)),
	)
}
