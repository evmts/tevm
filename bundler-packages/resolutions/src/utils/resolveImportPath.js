import { dirname, resolve as pathResolve } from 'node:path'
import { async as effectAsync, fail, succeed, try as trySync } from 'effect/Effect'
import resolve from 'resolve'
import { formatPath } from './formatPath.js'
import { isImportLocal } from './isImportLocal.js'

export class CouldNotResolveImportError extends Error {
	/**
	 * @type {'CouldNotResolveImportError'}
	 */
	_tag = 'CouldNotResolveImportError'
	/**
	 * @type {'CouldNotResolveImportError'}
	 * @override
	 */
	name = 'CouldNotResolveImportError'
	/**
	 * @param {string} importPath
	 * @param {string} absolutePath
	 * @param {Error} cause
	 */
	constructor(importPath, absolutePath, cause) {
		super(`Could not resolve import ${importPath} from ${absolutePath}. Please check your remappings and libraries.`, {
			cause,
		})
	}
}

/**
 * Returns whether a remapped import stays inside its remapping target.
 * `key/../../etc/passwd` must not escape `value`. A target without a trailing
 * separator is a plain string prefix, as in solc, so `value` + `rest` must still start with it.
 * @param {string} value Remapping target
 * @param {string} rest Import path after the remapping key
 * @param {string} target Resolved, formatted import path
 * @returns {boolean}
 */
const isWithinRemappingTarget = (value, rest, target) => {
	const root = formatPath(pathResolve(value))
	if (target === root) return true
	const rootDir = root.endsWith('/') ? root : `${root}/`
	if (target.startsWith(rootDir)) return true
	const isDirectoryTarget = /[\\/]$/.test(value) || /^[\\/]/.test(rest)
	return !isDirectoryTarget && target.startsWith(root)
}

/**
 * Resolve import statement to absolute file path
 *
 * @param {string} importPath import statement in *.sol contract
 * @param {string} absolutePath absolute path to the contract
 * @param {Record<string, string>} remappings remappings from the config
 * @param {ReadonlyArray<string>} libs libs from the config
 * @param {boolean} sync Whether to run this synchronously or not
 * @returns {import("effect/Effect").Effect<string, CouldNotResolveImportError,never>} absolute path to the imported file
 * @example
 * ```ts
 * const pathToSolidity = path.join(__dirname, '../Contract.sol')
 * ```
 */
export const resolveImportPath = (absolutePath, importPath, remappings, libs, sync) => {
	// Remappings (skip allocation/sort when remappings is empty)
	const remappingKeys = Object.keys(remappings)
	if (remappingKeys.length > 0) {
		if (remappingKeys.length > 1) remappingKeys.sort((a, b) => b.length - a.length)
		for (const key of remappingKeys) {
			if (importPath.startsWith(key)) {
				const value = /** @type {string} */ (remappings[key])
				// Do not use String.prototype.replace here: `$&`, `$'` and friends in the
				// remapping target would be interpreted as replacement patterns.
				const rest = importPath.slice(key.length)
				const target = formatPath(pathResolve(`${value}${rest}`))
				if (!isWithinRemappingTarget(value, rest, target)) {
					return fail(
						new CouldNotResolveImportError(
							importPath,
							absolutePath,
							new Error(`Import ${importPath} escapes remapping target ${value} for prefix ${key}`),
						),
					)
				}
				return succeed(target)
			}
		}
	}
	// Local import "./LocalContract.sol"
	if (isImportLocal(importPath)) {
		return succeed(formatPath(pathResolve(dirname(absolutePath), importPath)))
	}
	// try resolving with node resolution
	if (sync) {
		return trySync({
			try: () =>
				formatPath(
					resolve.sync(importPath, {
						basedir: dirname(absolutePath),
						paths: libs,
					}),
				),
			catch: (e) => new CouldNotResolveImportError(importPath, absolutePath, /** @type {Error}*/ (e)),
		})
	}
	return effectAsync((resume) => {
		resolve(
			importPath,
			{
				basedir: dirname(absolutePath),
				paths: libs,
			},
			(err, resolvedPath) => {
				if (err) {
					resume(fail(new CouldNotResolveImportError(importPath, absolutePath, err)))
				} else {
					resume(succeed(formatPath(/** @type {string} */ (resolvedPath))))
				}
			},
		)
	})
}
