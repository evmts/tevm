import { $ } from 'bun'
import { parseArgs } from './parseArgs.js'
import { runArgs } from './runArgs.js'

/**
 * Type guard for Bun shell execution errors.
 * @param {unknown} err
 * @returns {err is { stdout: { toString(): string }, stderr: { toString(): string }, exitCode: number }}
 */
const isShellError = (err) =>
	typeof err === 'object' && err !== null && 'stdout' in err && 'stderr' in err && 'exitCode' in err

/**
 * Executes the provided script using Bun with the specified configuration.
 * @param {string[]} [args] - Positional arguments (`[scriptPath, ...positionals]`) to pass to the script.
 * @returns {Promise<import('bun').$.ShellOutput>}
 */
export const run = async ([scriptPath, ...positionals] = parseArgs(process.argv).positionals) => {
	try {
		const args = runArgs(/** @type {string} */ (scriptPath), positionals)
		console.log(`[tevm-run] ${scriptPath}`)
		return await $`bun ${args}`
	} catch (err) {
		if (!isShellError(err)) throw err
		// Changed 'error' to 'err' to match usage below
		console.log('error')
		console.log(err.stdout.toString())
		console.error(`Failed with code ${err.exitCode}`)
		console.error(err.stderr.toString())
		throw new Error(`Error executing the script: ${err instanceof Error ? err.message : err.stderr.toString()}`, {
			cause: err,
		})
	}
}
