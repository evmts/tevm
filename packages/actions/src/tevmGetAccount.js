/**
 * Read native account state, decoding quantities to bigint.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('./TevmActions.js').GetAccountParams} params
 * @returns {Promise<import('./TevmActions.js').GetAccountResult>}
 */
export async function tevmGetAccount(client, { address }) {
	const account =
		/** @type {{balance: string; nonce: string; code: import('viem').Hex; storage: Record<import('viem').Hex, import('viem').Hex>}} */ (
			await client.request({ method: 'zevm_getAccount', params: [address] })
		)
	return {
		address,
		balance: BigInt(account.balance),
		nonce: BigInt(account.nonce),
		deployedBytecode: account.code,
		storage: account.storage,
	}
}
