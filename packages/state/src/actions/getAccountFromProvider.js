import { hexToBytes, keccak256, toBytes } from '@tevm/utils'
import { fromAccountData } from '../utils/accountHelpers.js'
import { getForkBlockTag } from './getForkBlockTag.js'
import { getForkClient } from './getForkClient.js'

/**
 * Fork transports that do not serve eth_getProof (e.g. Monad, ZKsync OS, Moonbeam).
 * Keyed by transport identity, which deepCopy/shallowCopy preserve, so the
 * downgrade is detected once per provider and survives state-manager copies.
 * @type {WeakMap<object, true>}
 */
const proofUnsupportedTransports = new WeakMap()

/**
 * Returns true for JSON-RPC errors meaning the provider does not serve the
 * method, checked across the cause chain via viem's `BaseError.walk`.
 * Duck-typed rather than `instanceof BaseError` so errors constructed by a
 * duplicate viem install still match. Uncoded errors are never treated as
 * capability failures.
 * @param {unknown} err
 * @returns {boolean}
 */
const isMethodUnavailableError = (err) => {
	/** @param {unknown} node @returns {boolean} */
	const isMethodUnavailable = (node) => {
		const code = /** @type {{code?: unknown}} */ (node)?.code
		if (code === -32601 || code === -32004) return true
		return (
			code === -32600 &&
			/not (available|found|supported)|unavailable/i.test(
				String(/** @type {{message?: unknown}} */ (node)?.message ?? ''),
			)
		)
	}
	const walk = /** @type {{walk?: (fn: (err: unknown) => boolean) => unknown}} */ (err)?.walk
	return typeof walk === 'function' ? walk.call(err, isMethodUnavailable) !== null : isMethodUnavailable(err)
}

/**
 * Retrieves an account from the provider and stores in the local trie.
 *
 * Hydrates via a single empty-storageKeys eth_getProof. Providers that do not
 * serve eth_getProof are downgraded once per transport to concurrent
 * eth_getBalance + eth_getTransactionCount + eth_getCode pinned to the same
 * fork block, with codeHash computed locally and storageRoot defaulting to the
 * canonical empty trie root (never read by EVM execution).
 * @param {import('../BaseState.js').BaseState} baseState
 * @returns {(address: import('@tevm/utils').EthjsAddress) => Promise<import('@tevm/utils').EthjsAccount>}
 * @private
 */
export const getAccountFromProvider = (baseState) => async (address) => {
	const client = getForkClient(baseState)
	const blockTag = getForkBlockTag(baseState)
	const addressHex = /** @type {import('@tevm/utils').Address}*/ (address.toString())
	const transport = /** @type {object} */ (baseState.options.fork?.transport)

	if (!proofUnsupportedTransports.has(transport)) {
		try {
			const accountData = await client.getProof({
				address: addressHex,
				storageKeys: [],
				...blockTag,
			})
			return fromAccountData({
				balance: BigInt(accountData.balance),
				nonce: BigInt(accountData.nonce),
				codeHash: toBytes(accountData.codeHash),
				storageRoot: toBytes(accountData.storageHash),
			})
		} catch (err) {
			if (!isMethodUnavailableError(err)) throw err
			proofUnsupportedTransports.set(transport, true)
			baseState.logger.warn(
				{ address: addressHex, error: /** @type {Error} */ (err).message },
				'eth_getProof is not served by the fork provider; permanently falling back to eth_getBalance/eth_getTransactionCount/eth_getCode for account hydration on this transport',
			)
		}
	}

	const [balance, nonce, code] = await Promise.all([
		client.getBalance({ address: addressHex, ...blockTag }),
		client.getTransactionCount({ address: addressHex, ...blockTag }),
		client.getCode({ address: addressHex, ...blockTag }),
	])

	// Prime both code caches so getContractCode skips its own eth_getCode; the
	// main cache is the source of truth for local overrides so never overwrite it
	const codeBytes = hexToBytes(code ?? '0x')
	if (!baseState.caches.contracts.has(address)) {
		baseState.caches.contracts.put(address, codeBytes)
	}
	baseState.forkCache.contracts.put(address, codeBytes)

	return fromAccountData({
		balance,
		nonce: BigInt(nonce),
		codeHash: keccak256(codeBytes, 'bytes'),
		// storageRoot omitted: createAccount defaults it to the canonical empty
		// trie root, which getAccount's nonexistent-account predicate requires
	})
}
