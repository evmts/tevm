import { configPath } from './configPath.js'

/**
 * Builds the `bun` argument list that `run` executes and logs.
 * Building it once keeps the logged command identical to the executed one.
 * @param {string} scriptPath - Script to run
 * @param {ReadonlyArray<string>} positionals - Arguments forwarded to the script
 * @returns {string[]} Arguments that follow `bun`
 * @example
 * ```js
 * runArgs('./script.ts', ['a']) // ['run', '--config=/.../bunfig.toml', '--install=fallback', './script.ts', 'a']
 * ```
 */
export const runArgs = (scriptPath, positionals) => [
	'run',
	`--config=${configPath}`,
	'--install=fallback',
	scriptPath,
	...positionals,
]
