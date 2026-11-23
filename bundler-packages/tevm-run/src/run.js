import { $ } from 'bun'
import { configPath } from './configPath.js'
import { parseArgs } from './parseArgs.js'

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
		const command = `[tevm-run] bun run --bun --config=${configPath} --install=fallback ${scriptPath} ${positionals.join(' ')}`
		console.log(command)
		return await $`bun run --config=${configPath} --install=fallback ${scriptPath} ${positionals}`
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
