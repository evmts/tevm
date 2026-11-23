/**
 * Solidity contract names that are valid Solidity identifiers but cannot be declared
 * with `export const <name>` in generated ES modules, TypeScript or declaration files.
 *
 * Contains the ECMAScript reserved words (generated modules are strict mode code),
 * the strict mode restricted bindings `eval` and `arguments`, and the bindings the
 * generated module itself imports (`createContract`, `Contract`).
 */
const UNDECLARABLE_NAMES = new Set([
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'eval',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	// bindings imported by the generated module
	'createContract',
	'Contract',
])

/**
 * Returns true when a contract name cannot be used as a local binding in generated code.
 * Such contracts are declared under an internal name and exported with `export { internal as name }`.
 *
 * @param {string} contractName - The Solidity contract name
 * @returns {boolean} Whether the generated module must export the contract through an alias
 * @example
 * ```javascript
 * needsExportAlias('class') // true
 * needsExportAlias('Counter') // false
 * ```
 * @internal
 */
export const needsExportAlias = (contractName) => UNDECLARABLE_NAMES.has(contractName)
