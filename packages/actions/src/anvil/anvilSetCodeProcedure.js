import { setAccountProcedure } from '../SetAccount/setAccountProcedure.js'
import { anvilInvalidParams } from './anvilInvalidParams.js'

/**
 * Request handler for anvil_setCode JSON-RPC requests.
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./AnvilProcedure.js').AnvilSetCodeProcedure}
 */
export const anvilSetCodeJsonRpcProcedure = (client) => {
	return async (request) => {
		if (!Array.isArray(request.params) || request.params.length !== 2) {
			return /** @type {any} */ (
				anvilInvalidParams(request, 'Invalid parameters for anvil_setCode. Expected an address and bytecode.')
			)
		}
		const result = await setAccountProcedure(client)({
			jsonrpc: request.jsonrpc,
			method: 'tevm_setAccount',
			params: [{ address: request.params[0], deployedBytecode: request.params[1] }],
			...(request.id !== undefined ? { id: request.id } : {}),
		})
		if (result.error) {
			return {
				...(request.id !== undefined ? { id: request.id } : {}),
				method: request.method,
				jsonrpc: request.jsonrpc,
				error: {
					code: /** @type any*/ (-32602),
					message: result.error.message,
				},
			}
		}
		return {
			...(request.id !== undefined ? { id: request.id } : {}),
			method: request.method,
			jsonrpc: request.jsonrpc,
			result: null,
		}
	}
}
