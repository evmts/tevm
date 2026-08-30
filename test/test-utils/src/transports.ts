import { loadBalance, rateLimit } from '@ponder/utils'
import { http } from 'viem'
import { mainnet as viemMainnet, optimism as viemOptimism } from 'viem/chains'
import { normalizeRpcUrl } from './getAlchemyUrl.js'

const readRpcUrls = (name: string): string[] =>
	(process.env[name]?.split(',') ?? [])
		.map((url) => url.trim())
		.filter(Boolean)
		.map(normalizeRpcUrl)

const mainnetRpcUrls = readRpcUrls('TEVM_RPC_URLS_MAINNET')
const optimismRpcUrls = readRpcUrls('TEVM_RPC_URLS_OPTIMISM')

if (mainnetRpcUrls.length === 0) {
	console.warn('TEVM_RPC_URLS_MAINNET is not set')
}
if (optimismRpcUrls.length === 0) {
	console.warn('TEVM_RPC_URLS_OPTIMISM is not set')
}

const mainnet = loadBalance(
	mainnetRpcUrls.map((url) => rateLimit(http(url), { browser: false, requestsPerSecond: 150 })),
)({ retryCount: 3, chain: viemMainnet })

const optimism = loadBalance(
	optimismRpcUrls.map((url) => rateLimit(http(url), { browser: false, requestsPerSecond: 150 })),
)({ retryCount: 3, chain: viemOptimism })

export const transports = {
	mainnet,
	optimism,
}
