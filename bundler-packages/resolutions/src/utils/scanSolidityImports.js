/**
 * @typedef {object} ScannedImport
 * @property {string} path - The raw import path between the quotes
 * @property {number} start - Offset of the first path character in the source
 * @property {number} end - Offset just past the last path character in the source
 */

/** @param {string | undefined} char */
const isIdentifierChar = (char) => char !== undefined && /[A-Za-z0-9_$]/.test(char)

/**
 * Returns the offset just past a comment starting at `index`, or `index` if none starts there.
 * @param {string} code
 * @param {number} index
 * @returns {number}
 */
const skipComment = (code, index) => {
	if (code[index] !== '/') return index
	if (code[index + 1] === '/') {
		const newline = code.indexOf('\n', index + 2)
		return newline === -1 ? code.length : newline
	}
	if (code[index + 1] === '*') {
		const close = code.indexOf('*/', index + 2)
		return close === -1 ? code.length : close + 2
	}
	return index
}

/**
 * Returns the offset just past the closing quote of a string literal opening at `index`.
 * Backslash escapes are honoured. An unterminated literal ends at the newline or end of input.
 * @param {string} code
 * @param {number} index
 * @returns {number}
 */
const skipString = (code, index) => {
	const quote = code[index]
	let i = index + 1
	while (i < code.length) {
		const char = code[i]
		if (char === '\\') {
			i += 2
			continue
		}
		if (char === quote) return i + 1
		if (char === '\n') return i
		i++
	}
	return code.length
}

/**
 * Parses the import statement whose `import` keyword ends at `index`.
 * The first string literal of the statement is the import path in every Solidity form:
 * `import "p";`, `import "p" as X;`, `import * as X from "p";` and `import {A} from "p";`.
 * Scanning resumes right after the path, so a missing `;` cannot swallow the next import.
 * @param {string} code
 * @param {number} index
 * @returns {{ found: ScannedImport | undefined, next: number }}
 */
const parseImportStatement = (code, index) => {
	let i = index
	while (i < code.length) {
		const afterComment = skipComment(code, i)
		if (afterComment !== i) {
			i = afterComment
			continue
		}
		const char = code[i]
		if (char === ';') return { found: undefined, next: i + 1 }
		if (char === '"' || char === "'") {
			const end = skipString(code, i)
			const pathEnd = end - 1 > i && code[end - 1] === char ? end - 1 : end
			return { found: { path: code.slice(i + 1, pathEnd), start: i + 1, end: pathEnd }, next: end }
		}
		i++
	}
	return { found: undefined, next: i }
}

/**
 * Finds every Solidity import statement with a single lexical pass.
 * Line comments, block comments and string literals are skipped, so text that merely
 * looks like an import inside them is ignored, and several imports may share a line.
 * @param {string} code - Solidity source code
 * @returns {ScannedImport[]} Imports in source order
 * @example
 * ```js
 * scanSolidityImports('pragma solidity ^0.8.0; import "./A.sol"; import {B} from "./B.sol";')
 * // [{ path: './A.sol', ... }, { path: './B.sol', ... }]
 * ```
 */
export const scanSolidityImports = (code) => {
	/** @type {ScannedImport[]} */
	const imports = []
	let i = 0
	while (i < code.length) {
		const afterComment = skipComment(code, i)
		if (afterComment !== i) {
			i = afterComment
			continue
		}
		const char = code[i]
		if (char === '"' || char === "'") {
			i = skipString(code, i)
			continue
		}
		if (isIdentifierChar(char)) {
			const start = i
			while (isIdentifierChar(code[i])) i++
			if (code.slice(start, i) === 'import') {
				const { found, next } = parseImportStatement(code, i)
				if (found) imports.push(found)
				i = next
			}
			continue
		}
		i++
	}
	return imports
}
