import { getRequestBody } from './internal/getRequestBody.js'

/**
 * Expose the native JSON-RPC dispatcher over HTTP. Parsing, batches, error
 * encoding and notification semantics are owned by ZEVM.
 * @param {import('./Client.js').Client} client
 * @param {{maxBodySize?: number; maxBatchSize?: number; requestTimeout?: number; cors?: boolean}} [options]
 * @returns {import('node:http').RequestListener}
 */
export function createHttpHandler(client, options = {}) {
	return async (req, res) => {
		if (options.cors) {
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.setHeader('Access-Control-Allow-Headers', 'content-type')
			res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
			if (req.method === 'OPTIONS') return void res.writeHead(204).end()
		}
		if (req.method !== 'POST') return void res.writeHead(405, { Allow: 'POST' }).end()
		req.setTimeout(options.requestTimeout ?? 30_000, () => req.destroy())
		const body = await getRequestBody(req, { maxBodySize: options.maxBodySize ?? 1024 * 1024 })
		if (typeof body !== 'string') return void res.writeHead(413).end()
		if (options.maxBatchSize !== undefined) {
			try {
				const parsed = JSON.parse(body)
				if (Array.isArray(parsed) && parsed.length > options.maxBatchSize) return void res.writeHead(413).end()
			} catch {
				/* The native parser returns the JSON-RPC parse error. */
			}
		}
		try {
			const response = await client.transport.tevm.rpc(body)
			if (response === null) return void res.writeHead(204).end()
			res.writeHead(200, { 'Content-Type': 'application/json' }).end(response)
		} catch {
			res
				.writeHead(503, { 'Content-Type': 'application/json' })
				.end(
					JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Native engine unavailable' } }),
				)
		}
	}
}
