import { createClient, publicActions, testActions, walletActions } from 'viem'
import { foundry } from 'viem/chains'
import { createTevmTransport } from './createTevmTransport.js'
import { tevmViemActions } from './tevmViemActions.js'

/**
 * Create a viem client backed by native ZEVM, Voltaire and Guillotine Mini.
 * The engine owns execution, state, transactions, mining, filters and tracing.
 * `client.chain` is `common`, or Foundry's chain with `chainId` applied. With an injected
 * `backend` or `engine` and neither `common` nor `chainId`, `client.chain` is `undefined`
 * and viem reads the ID with `eth_chainId`.
 * @param {import('./MemoryClientOptions.js').MemoryClientOptions} [options]
 * @returns {import('./MemoryClient.js').MemoryClient}
 * @example
 * import { createMemoryClient } from '@tevm/memory-client'
 * const client = createMemoryClient()
 * console.log(await client.getBlockNumber())
 * await client.tevmClose()
 */
export function createMemoryClient(options = {}) {
	const chain =
		options.common ??
		(options.chainId !== undefined
			? { ...foundry, id: options.chainId }
			: options.backend === undefined && options.engine === undefined
				? foundry
				: undefined)
	return createClient({
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
}
