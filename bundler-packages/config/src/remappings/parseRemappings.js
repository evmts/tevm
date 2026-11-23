/**
 * @typedef {{ remappings: Record<string, string> } | { invalid: string }} ParsedRemappings
 * @internal
 */

/**
 * Parses `prefix=target` remapping entries from remappings.txt or `forge config --json`.
 *
 * Like solc and foundry, only the first `=` separates prefix from target, so a target may
 * contain `=`. Blank entries are skipped and both halves are trimmed. An entry without a
 * non-empty prefix is invalid, because an empty prefix would match every import.
 * Targets resolve relative to `configFilePath`.
 *
 * The result is built from entries rather than by assignment, so prefixes such as
 * `__proto__`, `constructor` and `prototype` stay ordinary own keys and never touch
 * `Object.prototype` or the record's prototype.
 *
 * @param {ReadonlyArray<string>} entries - Raw remapping entries
 * @param {string} configFilePath - Directory the targets are relative to
 * @returns {ParsedRemappings} The remappings, or the first invalid entry
 * @example
 * ```javascript
 * parseRemappings(['@oz/=lib/oz/'], '/project') // { remappings: { '@oz/': '/project/lib/oz/' } }
 * parseRemappings(['nope'], '/project') // { invalid: 'nope' }
 * ```
 * @internal
 */
export const parseRemappings = (entries, configFilePath) => {
	const separator = configFilePath.includes('\\') && !configFilePath.includes('/') ? '\\' : '/'
	const baseDir =
		configFilePath.endsWith('/') || configFilePath.endsWith('\\') ? configFilePath : `${configFilePath}${separator}`
	/** @type {Array<[string, string]>} */
	const parsed = []
	for (const raw of entries) {
		if (typeof raw !== 'string') return { invalid: String(raw) }
		const entry = raw.trim()
		if (entry.length === 0) continue
		const separatorIndex = entry.indexOf('=')
		if (separatorIndex < 1) return { invalid: entry }
		const prefix = entry.slice(0, separatorIndex).trim()
		const target = entry.slice(separatorIndex + 1).trim()
		parsed.push([prefix, `${baseDir}${target.replace(/^[/\\]+/, '')}`])
	}
	return { remappings: Object.fromEntries(parsed) }
}
