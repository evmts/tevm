import { createHttpHandler } from '../createHttpHandler.js'

/**
 * Creates a Next.js API handler for a Tevm JSON-RPC server
 * @param {import('../Client.js').Client} client
 * @param {Parameters<typeof createHttpHandler>[1]} [options] HTTP handler options.
 * @returns {import('next').NextApiHandler}
 * @example
 * ```typescript
 * import { createNextApiHandler } from 'tevm/server'
 * import { createMemoryClient } from 'tevm'
 *
 * const tevm = createMemoryClient()
 * export default createNextApiHandler(tevm)
 * ```
 */
export const createNextApiHandler = (client, options) => {
	const handler = createHttpHandler(client, options)
	return async (req, res) => {
		return handler(req, res)
	}
}
