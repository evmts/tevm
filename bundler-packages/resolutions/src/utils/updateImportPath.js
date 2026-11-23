import { succeed } from 'effect/Effect'
import { scanSolidityImports } from './scanSolidityImports.js'

/**
 * @param {string} path
 * @param {string} quote
 */
const escapePath = (path, quote) =>
	path.replace(/['"\\]|[^\x20-\x7e]/gu, (char) => {
		if (char === quote || char === '\\') return `\\${char}`
		if (char === '"' || char === "'") return char
		// solc encodes each \u escape separately, so use UTF-8 bytes for supplementary characters.
		if (char.length === 2) return Array.from(Buffer.from(char), (byte) => `\\x${byte.toString(16)}`).join('')
		return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
	})

/**
 * Replaces the path of every import statement found by `scanSolidityImports`.
 * Uses the same scanner as `resolveImports`, so both agree on what an import is.
 * @param {string} code Source code to update
 * @param {(importPath: string) => string | undefined} getReplacement Returns the new path, or undefined to keep the path
 * @returns {string} The updated source code
 */
const replaceImportPaths = (code, getReplacement) => {
	let updated = ''
	let lastIndex = 0
	for (const { path, start, end } of scanSolidityImports(code)) {
		const replacement = getReplacement(path)
		if (replacement === undefined) {
			continue
		}
		updated += `${code.slice(lastIndex, start)}${escapePath(replacement, code.charAt(start - 1))}`
		lastIndex = end
	}
	return `${updated}${code.slice(lastIndex)}`
}

/**
 * Updates all the import paths that match the importedIds
 * @param {string} code Source code to update
 * @param {ReadonlyArray<import("../types.js").ResolvedImport>} resolvedImports Import to update
 * @returns {import("effect/Effect").Effect<string, never, never>} the source code formatted with the imprt replaced
 */
export const updateImportPaths = (code, resolvedImports) => {
	return succeed(
		replaceImportPaths(code, (importPath) => resolvedImports.find(({ original }) => original === importPath)?.updated),
	)
}

/**
 * Updates a specific import path in source code
 * @param {string} source - Source code to update
 * @param {string} oldPath - The original import path to replace
 * @param {string} newPath - The new import path
 * @returns {string} - Updated source code
 */
export const updateImportPath = (source, oldPath, newPath) => {
	return replaceImportPaths(source, (importPath) => (importPath === oldPath ? newPath : undefined))
}
