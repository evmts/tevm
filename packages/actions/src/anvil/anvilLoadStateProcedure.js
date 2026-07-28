import { hexToString } from '@tevm/utils'
import { loadStateProcedure } from '../LoadState/loadStateProcedure.js'
import { anvilInvalidParams } from './anvilInvalidParams.js'

/**
 * Request handler for anvil_loadState JSON-RPC requests.
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./AnvilProcedure.js').AnvilLoadStateProcedure}
 */
export const anvilLoadStateJsonRpcProcedure = (client) => {
	return async (request) => {
		const loadStateRequest = /** @type {import('./AnvilJsonRpcRequest.js').AnvilLoadStateJsonRpcRequest}*/ (request)
		const params = loadStateRequest.params ?? []
		if (!Array.isArray(params) || params.length !== 1 || typeof params[0] !== 'string' || !params[0].startsWith('0x')) {
			return /** @type {any} */ (
				anvilInvalidParams(
					loadStateRequest,
					'Invalid parameters for anvil_loadState. Expected one opaque hex state blob.',
				)
			)
		}
		try {
			const payload = JSON.parse(hexToString(/** @type {import('@tevm/utils').Hex} */ (params[0])))
			if (
				!payload ||
				typeof payload !== 'object' ||
				payload.format !== 'tevm-anvil-state-v1' ||
				!payload.state ||
				typeof payload.state !== 'object' ||
				Array.isArray(payload.state)
			) {
				return /** @type {any} */ (
					anvilInvalidParams(
						loadStateRequest,
						'Unsupported anvil_loadState blob. Tevm accepts blobs returned by Tevm anvil_dumpState.',
					)
				)
			}
			const result = await loadStateProcedure(client)({
				jsonrpc: '2.0',
				method: 'tevm_loadState',
				...(loadStateRequest.id !== undefined ? { id: loadStateRequest.id } : {}),
				params: [{ state: payload.state }],
			})
			if (result.error) {
				return {
					jsonrpc: '2.0',
					method: loadStateRequest.method,
					...(loadStateRequest.id !== undefined ? { id: loadStateRequest.id } : {}),
					error: /** @type {any} */ (result.error),
				}
			}
			return {
				jsonrpc: '2.0',
				method: loadStateRequest.method,
				result: true,
				...(loadStateRequest.id !== undefined ? { id: loadStateRequest.id } : {}),
			}
		} catch (error) {
			return /** @type {any} */ (
				anvilInvalidParams(
					loadStateRequest,
					`Invalid anvil_loadState blob: ${error instanceof Error ? error.message : 'could not decode hex state'}`,
				)
			)
		}
	}
}
