import { InvalidParamsError } from '@tevm/errors'
import { callHandler } from '../Call/callHandler.js'

/**
 * Creates a handler for `eth_sendUnsignedTransaction`.
 *
 * Submits a transaction on behalf of an arbitrary `from` address without a signature, exactly as
 * anvil's `eth_sendUnsignedTransaction` does. The account does not need to be impersonated and does
 * not need to be funded — the sender is trusted because this is a development node. The resulting
 * transaction is added to the txpool (or mined immediately when the node is in `auto` mining mode)
 * and produces a normal receipt.
 *
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./EthHandler.js').EthSendUnsignedTransactionHandler}
 * @throws {InvalidParamsError} If `from` is not provided
 * @example
 * ```typescript
 * import { createTevmNode } from 'tevm/node'
 * import { ethSendUnsignedTransactionHandler } from 'tevm/actions'
 *
 * const node = createTevmNode()
 * const sendUnsignedTransaction = ethSendUnsignedTransactionHandler(node)
 *
 * const txHash = await sendUnsignedTransaction({
 *   from: `0x${'11'.repeat(20)}`,
 *   to: `0x${'69'.repeat(20)}`,
 *   value: 420n,
 * })
 * console.log(txHash)
 * ```
 */
export const ethSendUnsignedTransactionHandler = (client) => async (params) => {
	if (!params.from) {
		throw new InvalidParamsError('eth_sendUnsignedTransaction requires a `from` address')
	}
	const transactionMode = client.miningConfig.type === 'auto' ? { addToBlockchain: true } : { addToMempool: true }
	const { errors, txHash } = await callHandler(client)({
		...params,
		...transactionMode,
		// unsigned transactions are trusted, the sender is never required to be funded
		skipBalance: true,
		throwOnFail: false,
	})
	if (errors?.length === 1) {
		throw errors[0]
	}
	if (errors?.length) {
		throw new AggregateError(errors)
	}
	if (!txHash) {
		throw new InvalidParamsError('eth_sendUnsignedTransaction did not produce a transaction hash')
	}
	return txHash
}
