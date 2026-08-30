// this file is adapted from ethers
// https://github.com/ethers-io/ethers.js/blob/main/src.ts/providers/provider-alchemy.ts

const DEFAULT_ALCHEMY_KEY = '_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC'

const ALCHEMY_HOSTS = Object.freeze({
	mainnet: 'eth-mainnet.g.alchemy.com',
	goerli: 'eth-goerli.g.alchemy.com',
	sepolia: 'eth-sepolia.g.alchemy.com',
	arbitrum: 'arb-mainnet.g.alchemy.com',
	'arbitrum-goerli': 'arb-goerli.g.alchemy.com',
	'arbitrum-sepolia': 'arb-sepolia.g.alchemy.com',
	base: 'base-mainnet.g.alchemy.com',
	'base-goerli': 'base-goerli.g.alchemy.com',
	'base-sepolia': 'base-sepolia.g.alchemy.com',
	matic: 'polygon-mainnet.g.alchemy.com',
	'matic-amoy': 'polygon-amoy.g.alchemy.com',
	'matic-mumbai': 'polygon-mumbai.g.alchemy.com',
	optimism: 'opt-mainnet.g.alchemy.com',
	'optimism-goerli': 'opt-goerli.g.alchemy.com',
	'optimism-sepolia': 'opt-sepolia.g.alchemy.com',
})

/**
 * Returns an alchemy url based on env variables for the given chain
 */
export const getAlchemyUrl = (
	chainId: keyof typeof ALCHEMY_HOSTS = 'optimism',
	alchemyKey = process.env['TEVM_TEST_ALCHEMY_KEY'] ?? DEFAULT_ALCHEMY_KEY,
): string => {
	if (alchemyKey === DEFAULT_ALCHEMY_KEY) {
		console.warn(`Using default alchemy key. Please override it with the 'TEVM_TEST_ALCHEMY_KEY' environment variable or pass in an explicit key as the second arg to 'getAlchemyUrl'
Using default alchemy key '${DEFAULT_ALCHEMY_KEY}' and may face throttling`)
	}
	return `https://${ALCHEMY_HOSTS[chainId]}/v2/${alchemyKey}`
}

/**
 * Rewrites an RPC URL on Alchemy's retired `*.alchemyapi.io` host to the
 * `*.g.alchemy.com` host that serves today. The retired host no longer
 * answers, and an operator's `TEVM_RPC_URLS_*` value can still carry it.
 *
 * @example
 * ```ts
 * import { normalizeRpcUrl } from '@tevm/test-utils'
 *
 * normalizeRpcUrl('https://eth-mainnet.alchemyapi.io/v2/key')
 * // 'https://eth-mainnet.g.alchemy.com/v2/key'
 * normalizeRpcUrl('https://mainnet.optimism.io')
 * // 'https://mainnet.optimism.io'
 * ```
 */
export const normalizeRpcUrl = (url: string): string =>
	url.replace(/^(https?:\/\/[a-z0-9-]+)\.alchemyapi\.io(?=\/|$)/i, '$1.g.alchemy.com')
