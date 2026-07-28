import { stringToHex } from '@tevm/utils'
import { dumpStateProcedure } from '../DumpState/dumpStateProcedure.js'
import { anvilInvalidParams } from './anvilInvalidParams.js'

/**
 * Request handler for anvil_dumpState JSON-RPC requests.
 *
 * The result is an opaque hex string, matching Anvil's response shape. The
 * encoded payload is specific to Tevm and can be passed back to
 * `anvil_loadState`.
 *
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./AnvilProcedure.js').AnvilDumpStateProcedure}
 */
export const anvilDumpStateJsonRpcProcedure = (client) => {
	return async (request) => {
		const params = request.params ?? []
		if (!Array.isArray(params) || params.length > 1 || (params[0] !== undefined && typeof params[0] !== 'boolean')) {
			return /** @type {any} */ (
				anvilInvalidParams(request, 'Invalid parameters for anvil_dumpState. Expected no parameters or one boolean.')
			)
		}
		if (params[0] === true) {
			return /** @type {any} */ (
				anvilInvalidParams(
					request,
					'anvil_dumpState does not support preserving historical states in Tevm. Pass false or omit the parameter.',
				)
			)
		}
		const response = await dumpStateProcedure(client)({
			...(request.id !== undefined ? { id: request.id } : {}),
			jsonrpc: '2.0',
			method: 'tevm_dumpState',
		})
		if (response.error) {
			return /** @type {any} */ ({
				...response,
				method: request.method,
			})
		}
		const payload = {
			format: 'tevm-anvil-state-v1',
			state: response.result.state,
		}
		return /** @type {any} */ ({
			jsonrpc: '2.0',
			method: request.method,
			result: stringToHex(JSON.stringify(payload)),
			...(request.id !== undefined ? { id: request.id } : {}),
		})
	}
}
