/**
 * Replaces the contents of block comments with spaces.
 * Newlines are kept, so every offset and line number of the result matches the source.
 * @param {string} code - Solidity source code
 * @returns {string} The source code with block comments blanked out
 * @example
 * ```ts
 * maskBlockComments('/* a *\/ import "./A.sol";') // '        import "./A.sol";'
 * ```
 */
export const maskBlockComments = (code) =>
	code.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
