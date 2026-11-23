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
 *   closeAll: () => Promise<void>,
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

	/** @type {Set<Promise<unknown>>} */
	const pending = new Set()
	let generation = 0
	const prune = () => {
		const currentTime = now()
		for (const [handle, session] of sessions) {
			if (session.expiresAt <= currentTime) {
				sessions.delete(handle)
				void session.client.tevmClose().catch(() => {})
			}
		}
	}

	/** @param {() => import('@tevm/memory-client').MemoryClient | Promise<import('@tevm/memory-client').MemoryClient>} create */
	const add = async (create) => {
		prune()
		const startedIn = generation
		if (sessions.size + pending.size >= maximumSessions)
			throw new Error(`Session limit reached (${maximumSessions}). Close an existing session before creating another.`)

		// Reserve capacity before fork discovery or engine construction can yield.
		const starting = Promise.resolve().then(async () => {
			let client
			try {
				if (generation !== startedIn) throw new Error('Session closed during creation')
				client = await create()
				await client.tevmReady()
				const chainId = await client.getChainId()
				const blockNumber = await client.getBlockNumber()
				if (generation !== startedIn) throw new Error('Session closed during creation')
				const handle = randomUUID()
				const expiresAt = now() + idleTtlMs
				const result = { handle, chainId, blockNumber, expiresAt: new Date(expiresAt).toISOString() }
				sessions.set(handle, { client, expiresAt })
				return result
			} catch (error) {
				await client?.tevmClose()
				throw error
			} finally {
				pending.delete(starting)
			}
		})
		pending.add(starting)
		return starting
	}

	return {
		createLocal: () => add(() => createMemoryClient({ mining: { auto: false } })),
		createFork: (input) =>
			add(async () => {
				const common = input.chain && input.chain !== 'auto' ? chainByName[input.chain] : undefined
				const chainId =
					common?.id ??
					(await createPublicClient({ transport: http(input.url, { retryCount: 0, timeout: 10000 }) }).getChainId())
				return createMemoryClient({
					...(common ? { common } : { chainId }),
					fork: {
						url: input.url,
						...(input.blockNumber ? { blockNumber: Number(input.blockNumber) } : {}),
					},
					mining: { auto: false },
				})
			}),
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
		closeAll: async () => {
			generation++
			const active = Array.from(sessions.values())
			sessions.clear()
			await Promise.all([Promise.allSettled(pending), ...active.map(({ client }) => client.tevmClose())])
		},
		size: () => {
			prune()
			return sessions.size
		},
	}
}
