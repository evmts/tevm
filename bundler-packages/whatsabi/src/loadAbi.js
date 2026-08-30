import { loaders, whatsabi } from '@shazow/whatsabi'
import { tolerantSignatureLookup } from './tolerantSignatureLookup.js'

/**
 * @param {object} options
 * @param {import('@tevm/utils').Address} options.address
 * @param {import('viem').Client} options.client
 * @param {string | undefined} options.explorerUrl
 * @param {boolean} options.followProxies
 * @param {string | undefined} options.etherscanApiKey
 * @returns {ReturnType<typeof import('@shazow/whatsabi').autoload>}
 */
export const loadAbi = async ({ address, client, explorerUrl, followProxies, etherscanApiKey }) => {
	return whatsabi.autoload(address, {
		provider: client,
		followProxies,
		// whatsabi's own default order; wrapped so a lookup-service outage
		// leaves selectors unnamed instead of rejecting the resolution.
		signatureLookup: tolerantSignatureLookup(
			new loaders.MultiSignatureLookup([new loaders.OpenChainSignatureLookup(), new loaders.FourByteSignatureLookup()]),
		),
		abiLoader: new loaders.MultiABILoader([
			new loaders.SourcifyABILoader({
				chainId: client.chain?.id ?? 1,
			}),
			...(explorerUrl !== undefined
				? [
						new loaders.EtherscanV1ABILoader({
							baseURL: explorerUrl,
							...(etherscanApiKey !== undefined ? { apiKey: etherscanApiKey } : {}),
						}),
					]
				: []),
		]),
	})
}
