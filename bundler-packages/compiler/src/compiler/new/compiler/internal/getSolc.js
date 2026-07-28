import { createSolc } from '@tevm/solc'
import { SolcError } from './errors.js'

/**
 * In-flight and resolved solc instances, keyed by version. `createSolc` fetches the
 * compiler over the network, so without this every call re-downloads a multi-megabyte
 * binary; concurrent callers previously raced and tripped over each other with EPIPE.
 * @type {Map<string, Promise<import('@tevm/solc').Solc>>}
 */
const solcInstances = new Map()

/**
 * Discard every cached solc instance. Intended for tests.
 * @returns {void}
 */
export const clearSolcCache = () => {
	solcInstances.clear()
}

/**
 * Instantiate a solc instance with a given version if not already instantiated
 * @param {import('@tevm/solc').SolcVersions} version - Solc version to load
 * @param {import('@tevm/logger').Logger} logger - The logger
 * @returns {Promise<import('@tevm/solc').Solc>}
 * @throws {SolcError} If the solc instance fails to load
 */
export const getSolc = async (version, logger) => {
	/** @type {Promise<import('@tevm/solc').Solc> | undefined} */
	let pending
	try {
		pending = solcInstances.get(version)
		if (pending === undefined) {
			pending = createSolc(version)
			solcInstances.set(version, pending)
		}
		const solcInstance = await pending
		logger.debug(`Successfully loaded solc instance for version ${version}`)
		return solcInstance
	} catch (error) {
		// A failed load must not be cached, so the next caller can retry.
		if (solcInstances.get(version) === pending) {
			solcInstances.delete(version)
		}
		const err = new SolcError(`Failed to load solc instance for version ${version}`, {
			cause: error,
			meta: { code: 'instantiation_failed', version },
		})
		logger.error(err.message)
		throw err
	}
}
