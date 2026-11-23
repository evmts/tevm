import { createClient, publicActions, testActions, walletActions } from 'viem'
import { foundry } from 'viem/chains'
import { createTevmTransport } from './createTevmTransport.js'
import { tevmViemActions } from './tevmViemActions.js'

/**
 * Create a viem client backed by native ZEVM, Voltaire and Guillotine Mini.
 * The engine owns execution, state, transactions, mining, filters and tracing.
 * `client.chain` is `common`, or Foundry's chain with `chainId` applied. An injected `backend`
 * owns its chain ID, so without `common` or `chainId` the client has no `chain` and viem reads
 * the ID from the backend with `eth_chainId`.
 * @param {import('./MemoryClientOptions.js').MemoryClientOptions} [options]
 * @returns {import('./MemoryClient.js').MemoryClient}
 * @example
 * import { createMemoryClient } from '@tevm/memory-client'
 * const client = createMemoryClient()
 * console.log(await client.getBlockNumber())
 * await client.tevmClose()
 */
export function createMemoryClient(options = {}) {
	// Never claim Foundry's 31337 for an injected backend: its chain ID is unknown until it is asked.
	const chain =
		options.common ??
		(options.chainId !== undefined
			? { ...foundry, id: options.chainId }
			: options.backend === undefined
				? foundry
				: undefined)
	const client = createClient({
		...(chain === undefined ? {} : { chain }),
		...(options.account === undefined ? {} : { account: options.account }),
		name: options.name ?? 'TEVM',
		key: options.key ?? 'tevm',
		cacheTime: 0,
		transport: createTevmTransport(options),
	})
		.extend(publicActions)
		.extend(walletActions)
		.extend(testActions({ mode: 'anvil' }))
		.extend(tevmViemActions())
	return /** @type {import('./MemoryClient.js').MemoryClient} */ (/** @type {unknown} */ (client))
}
