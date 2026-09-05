import { createZevmEngine } from '@tevm/node'
import { createTransport } from 'viem'

/**
 * Create a viem transport over one isolated native engine. Retries are disabled
 * because replaying a mutation after a transport failure can execute it twice.
 * @param {import('./MemoryClientOptions.js').MemoryClientOptions} [options]
 * @returns {import('viem').Transport<'tevm', { tevm: import('@tevm/node').ZevmEngine }>}
 * @example
 * import { createClient } from 'viem'
 * import { createTevmTransport } from '@tevm/memory-client'
 * const client = createClient({ transport: createTevmTransport() })
 * await client.transport.tevm.ready()
 * await client.transport.tevm.close()
 */
export function createTevmTransport(options = {}) {
	const chainId = options.chainId ?? options.common?.id
	const engine = options.engine ?? createZevmEngine({ ...options, ...(chainId === undefined ? {} : { chainId }) })
	return () =>
		createTransport(
			{
				key: 'tevm',
				name: 'ZEVM native engine',
				type: 'tevm',
				retryCount: 0,
				request: /** @type {import('viem').EIP1193RequestFn} */ (engine.request),
			},
			{ tevm: engine },
		)
}
