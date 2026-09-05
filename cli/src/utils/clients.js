/**
 * Utilities for handling different client types in the CLI
 */

/**
 * List of action names that are recognized as Viem actions
 * @type {string[]}
 */
const viemActionNames = [
	'createAccessList',
	'createBlockFilter',
	'createContractEventFilter',
	'createEventFilter',
	'estimateFeesPerGas',
	'readContract',
	'estimateGas',
	'getBalance',
	'getBlock',
	'getBlockNumber',
	'getBytecode',
	'getChainId',
	'getEnsAddress',
	'getEnsName',
	'getEnsText',
	'getGasPrice',
	'getStorageAt',
	'getTransaction',
	'getTransactionCount',
	'getTransactionReceipt',
	'multicall',
	'sendRawTransaction',
	'sendTransaction',
	'simulateCalls',
]

/**
 * Determines if the given action name is a Viem action
 * @param {string} actionName - The name of the action
 * @returns {boolean} - True if it's a Viem action, false otherwise
 */
export function isViemAction(actionName) {
	return viemActionNames.includes(actionName)
}

/**
 * Loads a Viem client with the specified RPC URL
 * Uses dynamic import with safety checks to avoid bundling issues
 *
 * @param {string} rpcUrl - The RPC endpoint URL
 * @returns {Promise<import('viem').PublicClient|null>} - A Viem client or null if loading fails
 */
export const loadViemClient = async (rpcUrl) => {
	try {
		const [module, chains] = await Promise.all([
			Function('return import("viem")')(),
			Function('return import("viem/chains")')(),
		])
		const transport = module.http(rpcUrl)
		const unconfiguredClient = module.createPublicClient({ transport })
		const chainId = await unconfiguredClient.getChainId()
		const chain = Object.values(chains).find((candidate) => candidate && candidate.id === chainId)
		return module.createPublicClient({
			...(chain ? { chain } : {}),
			transport,
		})
	} catch (_e) {
		return null
	}
}
