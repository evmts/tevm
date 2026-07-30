import { hexToBigInt } from '@tevm/utils'
import { ethSendUnsignedTransactionHandler } from './ethSendUnsignedTransactionHandler.js'

/**
 * Request handler for `eth_sendUnsignedTransaction` JSON-RPC requests.
 *
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./EthProcedure.js').EthSendUnsignedTransactionJsonRpcProcedure}
 * @throws {never} Errors are returned as JSON-RPC error responses by the request handler
 * @example
 * ```typescript
 * import { createTevmNode } from 'tevm/node'
 * import { ethSendUnsignedTransactionJsonRpcProcedure } from 'tevm/actions'
 *
 * const node = createTevmNode()
 * const procedure = ethSendUnsignedTransactionJsonRpcProcedure(node)
 *
 * const response = await procedure({
 *   jsonrpc: '2.0',
 *   id: 1,
 *   method: 'eth_sendUnsignedTransaction',
 *   params: [{ from: `0x${'11'.repeat(20)}`, to: `0x${'69'.repeat(20)}`, value: '0x1a4' }],
 * })
 * console.log(response.result)
 * ```
 */
export const ethSendUnsignedTransactionJsonRpcProcedure = (client) => {
	return async (request) => {
		const tx = request.params[0]
		const txHash = await ethSendUnsignedTransactionHandler(client)({
			from: /** @type {import('@tevm/utils').Address} */ (tx.from),
			...(tx.data ? { data: tx.data } : {}),
			...(tx.to ? { to: tx.to } : {}),
			...(tx.gas ? { gas: hexToBigInt(tx.gas) } : {}),
			...(tx.gasPrice ? { gasPrice: hexToBigInt(tx.gasPrice) } : {}),
			...(tx.value ? { value: hexToBigInt(tx.value) } : {}),
			...(tx.nonce ? { nonce: hexToBigInt(tx.nonce) } : {}),
		})
		return {
			method: request.method,
			result: txHash,
			jsonrpc: '2.0',
			...(request.id !== undefined ? { id: request.id } : {}),
		}
	}
}
