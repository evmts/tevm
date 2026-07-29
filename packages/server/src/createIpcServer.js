import { createServer as createNetServer } from 'node:net'
import { createIpcConnectionHandler } from './internal/createIpcConnectionHandler.js'

/**
 * Creates a Unix domain socket JSON-RPC server backed by a Tevm client.
 *
 * The server accepts concatenated or newline-delimited JSON-RPC messages and
 * streams `eth_subscription` notifications over the same connection.
 *
 * @param {import('./Client.js').Client} client - Tevm client that handles JSON-RPC requests.
 * @param {import('node:net').ServerOpts} [serverOptions] - Options passed to `node:net.createServer`.
 * @param {{ maxMessageSize?: number; maxBatchSize?: number }} [handlerOptions] - IPC framing limits.
 * @returns {import('node:net').Server} A Node.js server that can listen on a Unix domain socket path.
 * @throws {never} Startup and connection errors are emitted by the returned server.
 * @example
 * ```typescript
 * import { createMemoryClient } from 'tevm'
 * import { createIpcServer } from 'tevm/server'
 *
 * const client = createMemoryClient()
 * const server = createIpcServer(client)
 *
 * server.listen('/tmp/tevm.ipc', () => {
 *   console.log('Tevm IPC server listening at /tmp/tevm.ipc')
 * })
 * ```
 */
export const createIpcServer = (client, serverOptions = {}, handlerOptions = {}) =>
	createNetServer(serverOptions, createIpcConnectionHandler(client, handlerOptions))
