/**
 * @deprecated
 * Makes a JSON-RPC request to a url
 * Returns the entire JSON-RPC response rather than throwing and only returning result
 * Used currently as an adapter to avoid refactoring existing code
 * @see https://ethereum.org/en/developers/docs/apis/json-rpc/
 * @param {{request: import('viem').EIP1193RequestFn}} client - An EIP-1193 compatible client such as a viem client
 * @returns {import("./JsonRpcClient.js").JsonRpcClient} A JSON-RPC client whose `request` method resolves with the full JSON-RPC response (including `result` or `error`)
 * @example
 * ```typescript
 * import { createJsonRpcFetcher } from '@tevm/jsonrpc'
 * import { createPublicClient, http } from 'viem'
 * import { optimism } from 'viem/chains'
 *
 * const client = createPublicClient({
 *   chain: optimism,
 *   transport: http('https://mainnet.optimism.io'),
 * })
 * const fetcher = createJsonRpcFetcher(client)
 *
 * const { result: block } = await fetcher.request({
 *   method: 'eth_getBlockByNumber',
 *   params: ['latest', false],
 * })
 * console.log(block.number)
 * ```
 */
export const createJsonRpcFetcher = (client) => {
	return {
		request: async (request) => {
			try {
				const result = await client.request(request)
				return {
					jsonrpc: '2.0',
					method: request.method,
					result,
					...(request.id !== undefined ? { id: request.id } : {}),
				}
			} catch (e) {
				if (typeof e === 'object' && e !== null && 'code' in e) {
					const message =
						'message' in e && typeof e.message === 'string' ? e.message : 'Unknown error in jsonrpc request'
					const code = typeof e.code === 'number' ? e.code : Number(e.code)
					return {
						jsonrpc: '2.0',
						method: request.method,
						error: {
							code: Number.isFinite(code) ? code : -32000,
							message,
							...('data' in e ? { data: e.data } : {}),
						},
						...(request.id !== undefined ? { id: request.id } : {}),
					}
				}
				return {
					jsonrpc: '2.0',
					method: request.method,
					error: {
						code: -32000,
						message: e instanceof Error ? e.message : 'Unknown error in jsonrpc request',
					},
					...(request.id !== undefined ? { id: request.id } : {}),
				}
			}
		},
	}
}
