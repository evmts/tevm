import { readFileSync } from 'node:fs'
import * as path from 'node:path'
import { catchTag, die, fail, flatMap, logDebug, succeed, tap, try as tryEffect } from 'effect/Effect'
import { validateUserConfig } from '../config/validateUserConfig.js'

/**
 * TypeError thrown when the user provided remappings is not properly formatted
 * @internal
 */
export class InvalidRemappingsError extends TypeError {
	/**
	 * @type {'InvalidRemappingsError'}
	 * @override
	 */
	name = 'InvalidRemappingsError'
	/**
	 * @type {'InvalidRemappingsError'}
	 */
	_tag = 'InvalidRemappingsError'
}

/**
 * @typedef {InvalidRemappingsError } LoadRemappingsError
 * @internal
 */

/**
 * Synchronously loads a Tevm config from the given path
 * @param {string} configFilePath
 * @returns {import("effect/Effect").Effect<import('../types.js').CompilerConfig, LoadRemappingsError, never>} the contents of the tsconfig.json file
 * @internal
 */
export const loadRemappings = (configFilePath) => {
	const remappingsPath = path.join(configFilePath, 'remappings.txt')
	/**
	 * @param {string} configPath
	 */
	const readConfig = (configPath) =>
		tryEffect({
			try: () => readFileSync(configPath, 'utf8'),
			catch: () => new InvalidRemappingsError('No remapping file exists'),
		})
	return readConfig(remappingsPath).pipe(
		// if remappings doesn't exist that's fine just return nothing
		catchTag('InvalidRemappingsError', () => {
			return succeed('')
		}),
		flatMap((remappings) => {
			if (remappings.trim() === '') {
				return succeed({})
			}
			const remappingEntries = remappings
				.trim()
				// remappings.txt may use LF, CRLF or lone CR line endings
				.split(/\r\n|\r|\n/)
				.map((entry) => entry.trim())
				.filter((entry) => entry.length > 0)

			// validate remappings
			for (const remapping of remappingEntries) {
				// Like solc and foundry, only the first `=` separates prefix from target.
				// The target path itself may contain `=`. An empty prefix would match every import.
				if (remapping.indexOf('=') < 1) {
					return fail(
						new InvalidRemappingsError(
							`Invalid remapping ${remapping}. Remapping in remapping.txt should look like @solmate-utils/=lib/solmate/src/utils/`,
						),
					)
				}
			}

			// Turn remappings into a tevm config shape
			const separator = configFilePath.includes('\\') && !configFilePath.includes('/') ? '\\' : '/'
			const baseDir =
				configFilePath.endsWith('/') || configFilePath.endsWith('\\') ? configFilePath : `${configFilePath}${separator}`
			/**
			 * @type {import('../types.js').CompilerConfig}
			 */
			const config = {
				remappings: Object.fromEntries(
					remappingEntries.map((remapping) => {
						const separatorIndex = remapping.indexOf('=')
						const from = remapping.slice(0, separatorIndex)
						const to = remapping.slice(separatorIndex + 1)
						const relativeTarget = to.replace(/^[/\\]+/, '')
						return /** @type {[string, string]}*/ ([from, `${baseDir}${relativeTarget}`])
					}),
				),
			}
			return succeed(config)
		}),
		flatMap((cfg) => validateUserConfig(() => /** @type {import('../types.js').CompilerConfig}*/ (cfg))),
		// it can't thrw. Could clean this up via making validateUserConfig take a config instead of a factory
		catchTag('ConfigFnThrowError', (e) => die(e)),
		// internal error if this happens
		catchTag('InvalidConfigError', (e) => die(e)),
		tap((normalizedConfig) =>
			logDebug(`loading remappings from ${configFilePath}: ${JSON.stringify(normalizedConfig)}`),
		),
	)
}
