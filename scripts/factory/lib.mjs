import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { delimiter, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

export const readPolicy = async () => readJson(resolve(repositoryRoot, 'factory/policy.json'))

// pnpm prepends workspace node_modules/.bin directories while running a
// package script. Git hooks do not. Remove those injected entries when a
// bootstrap or preflight check needs to prove what the hook itself will find.
export const pathWithoutNodeModuleBins = () =>
	(process.env.PATH ?? '')
		.split(delimiter)
		.filter((entry) => !entry.replaceAll('\\', '/').endsWith('/node_modules/.bin'))
		.join(delimiter)

export const parseArgs = (argv) => {
	const parsed = new Map()
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index]
		if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`)
		const [rawName, inline] = token.slice(2).split('=', 2)
		if (parsed.has(rawName)) throw new Error(`Duplicate option: --${rawName}`)
		if (inline !== undefined) {
			parsed.set(rawName, inline)
			continue
		}
		const next = argv[index + 1]
		if (next !== undefined && !next.startsWith('--')) {
			parsed.set(rawName, next)
			index += 1
		} else {
			parsed.set(rawName, true)
		}
	}
	return parsed
}

export const option = (args, name, fallback) => {
	const value = args.get(name)
	return value === undefined ? fallback : value
}

export const command = (executable, args, options = {}) => {
	const output = execFileSync(executable, args, {
		cwd: options.cwd ?? repositoryRoot,
		encoding: 'utf8',
		stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
		env: options.env ?? process.env,
	})
	return typeof output === 'string' ? output.trim() : ''
}

export const assert = (condition, message) => {
	if (!condition) throw new Error(message)
}
