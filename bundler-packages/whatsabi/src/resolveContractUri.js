import { createClient, http } from 'viem'
import { getCode } from 'viem/actions'
import { knownChains } from './knownChains.js'
import { loadAbi } from './loadAbi.js'
import { parseUri } from './parseUri.js'

export class UnknownChainError extends Error {
	/**
	 * @type {'UnknownChainError'}
	 * @override
	 */
	name = 'UnknownChainError'
	/**
	 * @type {'UnknownChainError'}
	 */
	_tag = 'UnknownChainError'
	/**
	 * @param {number} chainId
	 */
	constructor(chainId) {
		super(
			`Unknown chain ID: ${chainId}. No default rpc known. Please pass in a valid rpc url as a query string \`?rpcUrl=\${rpcUrl}\` or open a pr to viem to add your chain to viem/chains`,
		)
	}
}

/**
 * Resolves an `evm://<chainId>/<address>` URI to the contract's ABI and deployed bytecode.
 * With `followProxies` (the default) the ABI is the implementation's, while `address` and
 * `deployedBytecode` always belong to the account the URI names.
 * @param {import('./ContractUri.js').ContractUri} contractUri
 * @param {import('@tevm/config').ResolvedCompilerConfig} _config - Reserved for compiler settings
 * @returns { Promise<{abi: import('@tevm/utils').Abi, address: import('@tevm/utils').Address, deployedBytecode: import('@tevm/utils').Hex} | undefined>}
 * @throws {UnknownChainError} if the chainId is not known and no rpcUrl is provided
 */
export const resolveContractUri = async (contractUri, _config) => {
	const parsedUri = parseUri(contractUri)
	if (!parsedUri) {
		return undefined
	}
	const chain = knownChains[parsedUri.chainId]
	if (!chain && !parsedUri.rpcUrl) {
		throw new UnknownChainError(parsedUri.chainId)
	}
	const client = createClient({
		transport: http(parsedUri.rpcUrl),
		// The ABI loaders use read-only RPC, the chain ID and the default URL.
		chain: chain && {
			id: chain.id,
			name: chain.name,
			nativeCurrency: chain.nativeCurrency,
			rpcUrls: chain.rpcUrls,
		},
	})
	const explorerUrl = parsedUri.etherscanBaseUrl ?? chain?.blockExplorers?.default.url

	const whatsabiResult = await loadAbi({
		client,
		chainId: parsedUri.chainId,
		explorerUrl,
		address: parsedUri.address,
		followProxies: parsedUri.followProxies ?? true,
		etherscanApiKey: parsedUri.etherscanApiKey,
	})
	// whatsabiResult.address is the implementation when a proxy was followed. Pairing the proxy
	// address with the implementation's bytecode would describe an account that does not exist.
	const deployedBytecode = await getCode(client, { address: parsedUri.address })
	if (!deployedBytecode) {
		throw new Error('Could not fetch deployed bytecode')
	}
	return {
		abi: /** @type {any}*/ (whatsabiResult.abi),
		address: parsedUri.address,
		deployedBytecode,
		// TODO if we can get a verified contract we should compile it with solc and return solc output too
	}
}
