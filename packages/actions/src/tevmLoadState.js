/** Load a state blob produced by ZEVM.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('viem').Hex} state
 * @returns {Promise<import('@tevm/node').JsonValue>}
 */
export function tevmLoadState(client, state) {
	return client.request({ method: 'anvil_loadState', params: [state] })
}
