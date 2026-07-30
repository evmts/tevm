import { NoSignerAvailableError } from '@tevm/errors'
import { prefundedAccounts } from '@tevm/node'

/**
 * Asserts that the node is able to sign for `from`, emulating anvil's signer semantics.
 *
 * Tevm auto-impersonates every sender by default, which makes anvil's `No Signer available`
 * failure path unobservable. When a node is created with `strictImpersonation: true` (or
 * `node.setStrictImpersonation(true)` is called) this assertion enforces anvil's rules:
 *
 * - one of the prefunded dev accounts → allowed (anvil has their private keys)
 * - the currently impersonated account → allowed
 * - auto impersonation enabled (`anvil_autoImpersonateAccount`) → allowed
 * - anything else → `NoSignerAvailableError`
 *
 * When strict impersonation is disabled (the default) this is a no-op, so existing
 * permissive behavior is preserved.
 *
 * @param {import('@tevm/node').TevmNode} client - The tevm node.
 * @param {import('@tevm/utils').Address | undefined} from - The sender of the transaction.
 * @returns {void}
 * @throws {NoSignerAvailableError} When strict impersonation is enabled and no signer exists for `from`.
 * @example
 * ```js
 * import { createTevmNode } from '@tevm/node'
 * import { assertSignerAvailable } from '@tevm/actions'
 *
 * const node = createTevmNode({ strictImpersonation: true })
 *
 * // throws NoSignerAvailableError
 * assertSignerAvailable(node, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 *
 * node.setImpersonatedAccount('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 * // no longer throws
 * assertSignerAvailable(node, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 * ```
 */
export const assertSignerAvailable = (client, from) => {
	if (typeof client.getStrictImpersonation !== 'function' || !client.getStrictImpersonation()) {
		return
	}
	if (from === undefined) {
		return
	}
	if (client.getAutoImpersonate()) {
		return
	}
	const normalized = from.toLowerCase()
	const impersonated = client.getImpersonatedAccount()
	if (impersonated !== undefined && impersonated.toLowerCase() === normalized) {
		return
	}
	if (prefundedAccounts.some((account) => account.toLowerCase() === normalized)) {
		return
	}
	throw new NoSignerAvailableError(
		`No Signer available for ${from}. Impersonate it with anvil_impersonateAccount, or disable strictImpersonation.`,
	)
}
