import { randomUUID } from 'node:crypto'
import { base, mainnet, optimism } from '@tevm/common'
import { createMemoryClient } from '@tevm/memory-client'
import { createPublicClient, http } from 'viem'

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
 *   close: (handle: string) => Promise<boolean>,
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
				void session.client.tevmClose()
			}
		}
	}

	/**
	 * @param {import('@tevm/memory-client').MemoryClient} client
	 */
	const add = async (client) => {
		prune()
		if (sessions.size >= maximumSessions) {
			await client.tevmClose()
			throw new Error(`Session limit reached (${maximumSessions}). Close an existing session before creating another.`)
		}
		try {
			await client.tevmReady()
		} catch (error) {
			await client.tevmClose()
			throw error
		}
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
					mining: { auto: false },
				}),
			),
		createFork: async (input) => {
			const common = input.chain && input.chain !== 'auto' ? chainByName[input.chain] : undefined
			const chainId =
				common?.id ??
				(await createPublicClient({ transport: http(input.url, { retryCount: 0, timeout: 10000 }) }).getChainId())
			return add(
				createMemoryClient({
					...(common ? { common } : { chainId }),
					fork: {
						url: input.url,
						...(input.blockNumber ? { blockNumber: Number(input.blockNumber) } : {}),
					},
					mining: { auto: false },
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
		close: async (handle) => {
			const session = sessions.get(handle)
			if (!session) return false
			sessions.delete(handle)
			await session.client.tevmClose()
			return true
		},
		size: () => {
			prune()
			return sessions.size
		},
	}
}
