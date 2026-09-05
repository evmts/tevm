/** Dump native state as ZEVM's hex-encoded state blob.
 * @param {import('./TevmActions.js').RpcClient} client
 * @returns {Promise<import('viem').Hex>}
 */
export async function tevmDumpState(client) {
	return /** @type {import('viem').Hex} */ (await client.request({ method: 'anvil_dumpState' }))
}
