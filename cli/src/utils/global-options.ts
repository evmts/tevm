export type NormalizedCliArguments = {
	argv: string[]
	json: boolean
	session?: string
}

/**
 * Normalize global options before Pastel routes to a command.
 *
 * `--json` and `--session` are accepted by every command even when an individual
 * command schema does not repeat those shared options.
 *
 * @example
 * ```ts
 * normalizeGlobalOptions(['node', 'tevm', 'call', '--json', '--session', 'demo'])
 * ```
 */
export function normalizeGlobalOptions(argv: string[]): NormalizedCliArguments {
	const normalized = argv.slice(0, 2)
	let json = process.env['TEVM_JSON'] === 'true'
	let session = process.env['TEVM_SESSION']

	for (let index = 2; index < argv.length; index++) {
		const value = argv[index]
		if (value === '--json') {
			json = true
			continue
		}
		if (value === '--no-json') {
			json = false
			continue
		}
		if (value?.startsWith('--json=')) {
			json = value.slice('--json='.length) !== 'false'
			continue
		}
		if (value === '--session') {
			const name = argv[index + 1]
			if (!name || name.startsWith('-')) {
				throw new Error('--session requires a name')
			}
			session = name
			index++
			continue
		}
		if (value?.startsWith('--session=')) {
			session = value.slice('--session='.length)
			continue
		}
		if (value !== undefined) {
			normalized.push(value)
		}
	}

	process.env['TEVM_JSON'] = String(json)
	if (session) {
		process.env['TEVM_SESSION'] = session
	}
	return {
		argv: normalized,
		json,
		...(session ? { session } : {}),
	}
}
