import { RpcError, RpcRequestError } from 'viem'

/** Bigints in provider diagnostics use decimal strings. Omit data that cannot be represented as JSON.
 * @param {{data: unknown}} error
 * @returns {{data?: unknown}}
 */
function errorData(error) {
	try {
		const json = JSON.stringify(error.data, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
		return json === undefined ? {} : { data: JSON.parse(json) }
	} catch {
		return {}
	}
}

/**
 * @deprecated
 * Adapts a viem client to return JSON-RPC envelopes. Provider failures retain integer codes and messages. Diagnostic bigints use decimal strings. Unserializable data is omitted.
 * Used currently as an adapter to avoid refactoring existing code
 * @see https://ethereum.org/en/developers/docs/apis/json-rpc/
 * @param {{request: import('viem').EIP1193RequestFn}} client
 * @returns {import("./JsonRpcClient.js").JsonRpcClient} Client returning the full JSON-RPC response
 * @example
 * ```typescript
 * import { createJsonRpcFetcher } from '@tevm/jsonrpc'
 * import { createPublicClient, custom } from 'viem'
 *
 * const client = createPublicClient({ transport: custom({ request: async () => '0x0' }) })
 * const fetcher = createJsonRpcFetcher(client)
 * const response = await fetcher.request({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
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
			} catch (caught) {
				// Viem wraps the provider envelope in RpcRequestError and may wrap it again for a known code.
				const transport = caught instanceof RpcError && caught.cause instanceof RpcRequestError ? caught.cause : caught
				const e = transport instanceof RpcRequestError ? transport.cause : caught
				if (typeof e === 'object' && e !== null && 'code' in e) {
					const message =
						'message' in e && typeof e.message === 'string' ? e.message : 'Unknown error in jsonrpc request'
					const code = typeof e.code === 'string' && /^-?\d+$/.test(e.code) ? Number(e.code) : e.code
					return {
						jsonrpc: '2.0',
						method: request.method,
						error: {
							code: typeof code === 'number' && Number.isInteger(code) ? code : -32000,
							message,
							...('data' in e ? errorData(e) : {}),
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
