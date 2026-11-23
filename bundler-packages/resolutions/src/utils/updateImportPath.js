import { succeed } from 'effect/Effect'
import { maskBlockComments } from './maskBlockComments.js'

/**
 * Replaces the path of every import statement outside of block comments.
 * Uses the same comment masking as `resolveImports`, so both agree on what an import is.
 * @param {string} code Source code to update
 * @param {(importPath: string) => string | undefined} getReplacement Returns the new path, or undefined to keep the path
 * @returns {string} The updated source code
 */
const replaceImportPaths = (code, getReplacement) => {
	// The closing quote must match the opening quote: `import "./it's/A.sol"` is one path
	const solidityImportRegex = /(^\s*import\b\s+[^'"]*(['"]))((?:(?!\2).)*)\2/gm
	let updated = ''
	let lastIndex = 0
	// Masking keeps offsets, so matches found in the masked code index into the original code
	for (const match of maskBlockComments(code).matchAll(solidityImportRegex)) {
		const [, prefix, , importPath] = /** @type {[string, string, string, string]} */ (/** @type {unknown} */ (match))
		const replacement = getReplacement(importPath)
		if (replacement === undefined) {
			continue
		}
		const start = match.index + prefix.length
		updated += `${code.slice(lastIndex, start)}${replacement}`
		lastIndex = start + importPath.length
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
