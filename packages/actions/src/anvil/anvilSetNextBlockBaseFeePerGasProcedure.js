import { anvilInvalidParams } from './anvilInvalidParams.js'

/**
 * Request handler for anvil_setNextBlockBaseFeePerGas JSON-RPC requests.
 * Sets the base fee per gas for the next block only (EIP-1559).
 * After the next block is mined, the base fee will revert to being calculated automatically.
 *
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./AnvilProcedure.js').AnvilSetNextBlockBaseFeePerGasProcedure}
 */
export const anvilSetNextBlockBaseFeePerGasJsonRpcProcedure = (client) => {
	return async (request) => {
		if (!Array.isArray(request.params) || request.params.length !== 1) {
			return /** @type {any} */ (
				anvilInvalidParams(request, 'Invalid parameters for anvil_setNextBlockBaseFeePerGas. Expected one quantity.')
			)
		}
		try {
			const baseFeePerGas = BigInt(request.params[0])
			client.setNextBlockBaseFeePerGas(baseFeePerGas)
			return {
				method: request.method,
				result: null,
				jsonrpc: '2.0',
				...(request.id !== undefined ? { id: request.id } : {}),
			}
		} catch (error) {
			return /** @type {any} */ (
				anvilInvalidParams(
					request,
					`Invalid quantity for anvil_setNextBlockBaseFeePerGas: ${
						error instanceof Error ? error.message : 'could not parse value'
					}`,
				)
			)
		}
	}
}
