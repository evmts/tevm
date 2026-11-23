import { readFileSync } from 'node:fs'
import * as path from 'node:path'
import { catchTag, die, fail, flatMap, logDebug, succeed, tap, try as tryEffect } from 'effect/Effect'
import { validateUserConfig } from '../config/validateUserConfig.js'
import { parseRemappings } from '../remappings/parseRemappings.js'

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
			// remappings.txt may use LF, CRLF or lone CR line endings
			const parsed = parseRemappings(remappings.split(/\r\n|\r|\n/), configFilePath)
			if ('invalid' in parsed) {
				return fail(
					new InvalidRemappingsError(
						`Invalid remapping ${parsed.invalid}. Remapping in remapping.txt should look like @solmate-utils/=lib/solmate/src/utils/`,
					),
				)
			}
			if (Object.keys(parsed.remappings).length === 0) {
				return succeed({})
			}
			return succeed(/** @type {import('../types.js').CompilerConfig} */ ({ remappings: parsed.remappings }))
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
