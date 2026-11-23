import { createHttpHandler } from '../createHttpHandler.js'

/**
 * Creates express middleware for a Tevm JSON-RPC server
 * @param {import('../Client.js').Client} client
 * @param {Parameters<typeof createHttpHandler>[1]} [options] HTTP handler options.
 * @returns {import('express').RequestHandler}
 * @example
 * ```typescript
 * import express from 'express'
 * import { createExpressMiddleware } from 'tevm/server'
 * import { createMemoryClient } from 'tevm'
 *
 * const tevm = createMemoryClient()
 *
 * const app = express()
 * app.use(express.json())
 * app.use(createExpressMiddleware(tevm))
 * app.listen(8080, () => console.log('listening on 8080'))
 * ```
 *
 * After creating an express server it can be interacted with using any JSON-RPC client
 * including viem, ethers or the built in tevm client
 * ```typescript
 * import { createClient } from 'tevm/client'
 *
 * const client = createClient({
 *  url: 'http://localhost:8080'
 *  })
 *
 *  const blockNumber = await client.eth.getBlockNumber()
 *  const chainId = await client.eth.getChainId()
 *  ```
 */
export function createExpressMiddleware(client, options) {
	const handler = createHttpHandler(client, options)
	return async (req, res) => {
		return handler(req, res)
	}
}
