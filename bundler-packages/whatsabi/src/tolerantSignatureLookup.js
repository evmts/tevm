/**
 * Wraps a whatsabi signature lookup so an outage of the lookup service
 * degrades to "no known names" instead of failing contract resolution.
 *
 * whatsabi consults a signature database (OpenChain, then 4byte) only to name
 * selectors the ABI loaders could not describe. That enrichment is optional:
 * the ABI and deployed bytecode are already resolved by the time it runs, so
 * a network failure reaching the database must not reject the whole
 * `resolveContractUri` call, which it did on a CI runner that could not reach
 * `api.openchain.xyz`.
 *
 * @param {import('@shazow/whatsabi').loaders.SignatureLookup} inner - The lookup to protect.
 * @param {(error: unknown) => void} [onError] - Receives each swallowed error; defaults to ignoring it.
 * @returns {import('@shazow/whatsabi').loaders.SignatureLookup} A lookup that never rejects.
 * @example
 * ```js
 * import { loaders } from '@shazow/whatsabi'
 * import { tolerantSignatureLookup } from './tolerantSignatureLookup.js'
 *
 * const lookup = tolerantSignatureLookup(new loaders.OpenChainSignatureLookup())
 * const names = await lookup.loadFunctions('0x06fdde03') // ['name()'] online, [] when the service is down
 * ```
 */
export const tolerantSignatureLookup = (inner, onError = () => {}) => ({
	loadFunctions: async (selector) => {
		try {
			return await inner.loadFunctions(selector)
		} catch (error) {
			onError(error)
			return []
		}
	},
	loadEvents: async (hash) => {
		try {
			return await inner.loadEvents(hash)
		} catch (error) {
			onError(error)
			return []
		}
	},
})
