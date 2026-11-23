import { all, die, fail, map } from 'effect/Effect'
import { maskBlockComments } from './utils/maskBlockComments.js'
import { resolveImportPath } from './utils/resolveImportPath.js'

class ImportDoesNotExistError extends Error {
	/**
	 * @type {'ImportDoesNotExistError'}
	 */
	_tag = 'ImportDoesNotExistError'
	/**
	 * @type {'ImportDoesNotExistError'}
	 * @override
	 */
	name = 'ImportDoesNotExistError'
	constructor() {
		super('Import does not exist')
	}
}

/**
 * @typedef {ImportDoesNotExistError | import("./utils/resolveImportPath.js").CouldNotResolveImportError} ResolveImportsError
 */

/**
 * Returns a the import resolutions for the given code
 * @param {string} absolutePath
 * @param {string} code
 * @param {Record<string, string>} remappings
 * @param {ReadonlyArray<string>} libs
 * @param {boolean} sync
 *
 * @returns {import("effect/Effect").Effect<ReadonlyArray<import("./types.js").ResolvedImport>, ResolveImportsError, never>}
 * @example
 * ```ts
 * const pathToSolidity = path.join(__dirname, '../Contract.sol')
 * const code = fs.readFileSync(pathToSolidity, 'utf8'),
 * const remappings = {}
 * const lib = []
 *
 * const imports = runPromise(
 *   resolveImports(
 *     pathToSolidity,
 *     code,
 *     remappings,
 *     libs,
 *     false
 *   )
 * )
 * console.log(imports) // [{ updated: '/path/to/Contract.sol', absolute: '/path/to/Contract.sol', original: '../Contract.sol' }]
 * ```
 */
export const resolveImports = (absolutePath, code, remappings, libs, sync) => {
	// The closing quote must match the opening quote: `import "./it's/A.sol"` is one path
	const importRegEx = /^\s*import\b\s+[^'"]*(['"])((?:(?!\1).)*)\1\s*/gm

	if (typeof absolutePath !== 'string') {
		return die(`Type ${typeof absolutePath} is not of type string`)
	}
	if (typeof code !== 'string') {
		return die(`Type ${typeof code} is not of type string`)
	}
	if (typeof sync !== 'boolean') {
		return die(`Type ${typeof sync} is not of type boolean`)
	}
	const codeWithoutBlockComments = maskBlockComments(code)
	const allImports =
		/** @type Array<import("effect/Effect").Effect<import("./types.js").ResolvedImport, import("./utils/resolveImportPath.js").CouldNotResolveImportError, >> */ ([])
	let foundImport = importRegEx.exec(codeWithoutBlockComments)
	while (foundImport != null) {
		const importPath = foundImport[2]
		if (!importPath) {
			return fail(new ImportDoesNotExistError())
		}
		allImports.push(
			resolveImportPath(absolutePath, importPath, remappings, libs, sync).pipe(
				map((absolute) => ({
					updated: absolute,
					absolute,
					original: importPath,
				})),
			),
		)
		foundImport = importRegEx.exec(codeWithoutBlockComments)
	}
	return all(allImports)
}
