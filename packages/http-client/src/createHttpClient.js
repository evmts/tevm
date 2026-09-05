import { tevmViemExtension } from '@tevm/viem'
import { createPublicClient, http } from 'viem'

/** Create a remote client for a native TEVM HTTP server.
 * @param {{url: string; name?: string}} options
 */
export function createHttpClient({ url, name = 'TEVM HTTP' }) {
	return createPublicClient({ name, transport: http(url, { retryCount: 0 }) }).extend(tevmViemExtension())
}
