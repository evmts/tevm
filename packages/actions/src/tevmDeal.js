import { toHex } from 'viem'

/** Set an account's native token balance.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {{address: import('viem').Address; amount: bigint}} params
 * @returns {Promise<import('@tevm/node').JsonValue>}
 */
export function tevmDeal(client, { address, amount }) {
	return client.request({ method: 'anvil_setBalance', params: [address, toHex(amount)] })
}
