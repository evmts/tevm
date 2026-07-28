import { randomUUID } from 'node:crypto'
import { base, mainnet, optimism } from '@tevm/common'
import { createMemoryClient } from '@tevm/memory-client'
import { http } from 'viem'

const chainByName = {
	mainnet,
	optimism,
	base,
}

/**
 * Creates an isolated Tevm session manager with idle expiration.
 *
 * @param {{idleTtlMs?: number, maximumSessions?: number, now?: () => number}} [options] - Session limits.
 * @returns {{
 *   createLocal: () => Promise<{handle: string, chainId: number, blockNumber: bigint, expiresAt: string}>,
 *   createFork: (input: {url: string, blockNumber?: string, chain?: 'auto' | 'mainnet' | 'optimism' | 'base'}) => Promise<{handle: string, chainId: number, blockNumber: bigint, expiresAt: string}>,
 *   get: (handle: string) => import('@tevm/memory-client').MemoryClient,
 *   close: (handle: string) => boolean,
 *   size: () => number
 * }} A manager whose handles expire after the configured idle lifetime.
 *
 * @example
 * ```js
 * import { createSessionManager } from '@tevm/mcp'
 *
 * const sessions = createSessionManager()
 * const { handle } = await sessions.createLocal()
 * const client = sessions.get(handle)
 * console.log(await client.getBlockNumber())
 * ```
 */
export const createSessionManager = (options = {}) => {
	const idleTtlMs = options.idleTtlMs ?? 30 * 60 * 1000
	const maximumSessions = options.maximumSessions ?? 32
	const now = options.now ?? Date.now
	/** @type {Map<string, {client: import('@tevm/memory-client').MemoryClient, expiresAt: number}>} */
	const sessions = new Map()

	const prune = () => {
		const currentTime = now()
		for (const [handle, session] of sessions) {
			if (session.expiresAt <= currentTime) {
				sessions.delete(handle)
			}
		}
	}

	/**
	 * @param {import('@tevm/memory-client').MemoryClient} client
	 */
	const add = async (client) => {
		prune()
		if (sessions.size >= maximumSessions) {
			throw new Error(`Session limit reached (${maximumSessions}). Close an existing session before creating another.`)
		}
		await client.tevmReady()
		const handle = randomUUID()
		const expiresAt = now() + idleTtlMs
		sessions.set(handle, { client, expiresAt })
		return {
			handle,
			chainId: await client.getChainId(),
			blockNumber: await client.getBlockNumber(),
			expiresAt: new Date(expiresAt).toISOString(),
		}
	}

	return {
		createLocal: () =>
			add(
				createMemoryClient({
					miningConfig: { type: 'manual' },
				}),
			),
		createFork: (input) => {
			const common = input.chain && input.chain !== 'auto' ? chainByName[input.chain] : undefined
			return add(
				createMemoryClient({
					...(common ? { common } : {}),
					fork: {
						transport: http(input.url)({}),
						...(input.blockNumber ? { blockTag: BigInt(input.blockNumber) } : {}),
					},
					miningConfig: { type: 'manual' },
				}),
			)
		},
		get: (handle) => {
			prune()
			const session = sessions.get(handle)
			if (!session) {
				throw new Error(`Unknown or expired session handle: ${handle}`)
			}
			session.expiresAt = now() + idleTtlMs
			return session.client
		},
		close: (handle) => sessions.delete(handle),
		size: () => {
			prune()
			return sessions.size
		},
	}
}
