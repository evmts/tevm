import { MethodNotSupportedError } from '@tevm/errors'
import { anvilInvalidParams } from './anvilInvalidParams.js'

/**
 * Request handler for anvil_setChainId JSON-RPC requests.
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./AnvilProcedure.js').AnvilSetChainIdProcedure}
 */
export const anvilSetChainIdJsonRpcProcedure = (client) => {
	return async (request) => {
		if (!Array.isArray(request.params) || request.params.length !== 1 || typeof request.params[0] !== 'number') {
			return /** @type {any} */ (
				anvilInvalidParams(request, 'Invalid parameters for anvil_setChainId. Expected one numeric chain ID.')
			)
		}
		const chainId = request.params[0]
		if (!Number.isInteger(chainId) || chainId <= 0) {
			return {
				...(request.id !== undefined ? { id: request.id } : {}),
				method: request.method,
				jsonrpc: request.jsonrpc,
				error: {
					code: /** @type any*/ (-32602),
					message: `Invalid id ${chainId}. Must be a positive integer.`,
				},
			}
		}
		const err = new MethodNotSupportedError(
			'anvil_setChainId is not supported. Chain ID is set at node creation time and cannot be changed at runtime.',
		)
		client.logger.error(err)
		return /**@type any*/ ({
			...(request.id !== undefined ? { id: request.id } : {}),
			method: request.method,
			jsonrpc: '2.0',
			error: {
				code: err.code,
				message: err.message,
			},
		})
	}
}
