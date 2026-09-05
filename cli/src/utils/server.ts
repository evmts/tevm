import type { Server as HttpServer } from 'node:http'
import {
	arbitrum,
	arbitrumSepolia,
	avalanche,
	base,
	blast,
	bsc,
	gnosis,
	mainnet,
	moonbeam,
	optimism,
	optimismGoerli,
	optimismSepolia,
	polygon,
	scroll,
	sepolia,
	tevmDefault,
	zksync,
} from '@tevm/common'
import { createMemoryClient, type MemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
import { createLoggingRequestProxy } from '../stores/logStore.js'

const parseForkBlock = (value: string): number => {
	const block = Number(value)
	if (!Number.isSafeInteger(block) || block < 0)
		throw new Error('Fork block must be a non-negative safe integer; omit it for latest')
	return block
}

export async function initializeServer({
	port,
	host,
	chainId,
	verbose,
	fork,
	forkBlockNumber,
}: {
	port: number
	host: string
	chainId: string
	fork?: string
	forkBlockNumber: string
	loggingLevel: string
	verbose: boolean
}): Promise<{ client: MemoryClient; server: HttpServer }> {
	const chains: Record<number, any> = {
		[base.id]: base,
		[mainnet.id]: mainnet,
		[optimism.id]: optimism,
		[tevmDefault.id]: tevmDefault,
		[optimismSepolia.id]: optimismSepolia,
		[optimismGoerli.id]: optimismGoerli,
		[sepolia.id]: sepolia,
		[arbitrum.id]: arbitrum,
		[arbitrumSepolia.id]: arbitrumSepolia,
		[avalanche.id]: avalanche,
		[bsc.id]: bsc,
		[polygon.id]: polygon,
		[zksync.id]: zksync,
		[gnosis.id]: gnosis,
		[moonbeam.id]: moonbeam,
		[blast.id]: blast,
		[scroll.id]: scroll,
	}

	const id = Number(chainId)
	if (!Number.isSafeInteger(id) || id < 0) throw new Error('Chain ID must be an unsigned safe integer')
	const chain = chains[id] ?? { ...tevmDefault, id, name: `ZEVM ${id}` }

	const client = createMemoryClient({
		common: chain,
		...(fork?.length
			? {
					fork: {
						url: fork,
						...(forkBlockNumber && forkBlockNumber !== 'latest'
							? { blockNumber: parseForkBlock(forkBlockNumber) }
							: {}),
					},
				}
			: {}),
	})
	await client.tevmReady()

	// Add request logging if verbose mode is enabled
	if (verbose) {
		// Create a proxy around the request function
		const originalRequest = client.request
		client.request = createLoggingRequestProxy(originalRequest, verbose)
	}

	// Create and start the server
	const server = createServer(client)

	// Handle graceful shutdown
	const handleShutdown = () => {
		server.close(() => {
			void client.tevmClose()
		})
	}

	process.on('SIGINT', handleShutdown)
	process.on('SIGTERM', handleShutdown)

	await new Promise<void>((resolve) => {
		server.listen(port, host, () => {
			resolve()
		})
	})

	// Return the client and server for use by action components
	return { client, server }
}
