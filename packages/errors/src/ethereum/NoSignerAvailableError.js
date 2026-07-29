import { BaseError } from './BaseError.js'

/**
 * Parameters for constructing a NoSignerAvailableError.
 * @typedef {Object} NoSignerAvailableErrorParameters
 * @property {string} [docsBaseUrl]
 * @property {string} [docsPath]
 * @property {string} [docsSlug]
 * @property {string[]} [metaMessages]
 * @property {BaseError|Error} [cause]
 * @property {string} [details]
 * @property {object} [meta]
 */

/**
 * Represents an error that occurs when a transaction is sent from an address the
 * node cannot sign for.
 *
 * Tevm is permissive by default: any `from` address is implicitly impersonated so
 * transactions always succeed. That is convenient for testing but it diverges from
 * anvil, which rejects `eth_sendTransaction` with `No Signer available` when the
 * sender is neither one of its dev accounts nor an actively impersonated account.
 *
 * This error is thrown only when a node is created with `strictImpersonation: true`,
 * which makes tevm faithfully emulate anvil's behavior so that suites asserting the
 * failure path (for example viem's `impersonateAccount` / `stopImpersonatingAccount`
 * tests) can hold against tevm.
 *
 * @example
 * ```ts
 * import { createTevmNode } from '@tevm/node'
 * import { NoSignerAvailableError } from '@tevm/errors'
 * import { ethSendTransactionHandler } from '@tevm/actions'
 *
 * const node = createTevmNode({ strictImpersonation: true })
 *
 * try {
 *   await ethSendTransactionHandler(node)({
 *     from: '0x1234567890123456789012345678901234567890',
 *     to: '0x0000000000000000000000000000000000000001',
 *     value: 0n,
 *   })
 * } catch (error) {
 *   if (error instanceof NoSignerAvailableError) {
 *     console.error(error.message) // No Signer available for 0x1234...
 *   }
 * }
 * ```
 *
 * @param {string} message - A human-readable error message.
 * @param {NoSignerAvailableErrorParameters} [args={}] - Additional parameters for the BaseError.
 */
export class NoSignerAvailableError extends BaseError {
	/**
	 * The error code for NoSignerAvailableError. Matches anvil/hardhat's
	 * "resource not found" JSON-RPC code for an unknown account.
	 * @type {number}
	 */
	static code = -32000

	/**
	 * Constructs a NoSignerAvailableError.
	 *
	 * @param {string} message - Human-readable error message.
	 * @param {NoSignerAvailableErrorParameters} [args={}] - Additional parameters for the BaseError.
	 * @param {string} [tag='NoSignerAvailable'] - The tag for the error.
	 */
	constructor(message, args = {}, tag = 'NoSignerAvailable') {
		super(
			message,
			{
				...args,
				docsBaseUrl: 'https://tevm.sh',
				docsPath: '/reference/tevm/errors/classes/nosigneravailableerror/',
			},
			tag,
			NoSignerAvailableError.code,
		)
	}
}
