import { toHex } from 'viem'

/**
 * Update specified account fields using native development controls.
 * Each field is an individual native mutation; use snapshots for grouped rollback.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('./TevmActions.js').SetAccountParams} params
 * @returns {Promise<void>}
 */
export async function tevmSetAccount(client, params) {
	/** @type {import('@tevm/node').EngineRequest[]} */
	const requests = []
	if (params.balance !== undefined)
		requests.push({ method: 'anvil_setBalance', params: [params.address, toHex(params.balance)] })
	if (params.nonce !== undefined)
		requests.push({ method: 'anvil_setNonce', params: [params.address, toHex(params.nonce)] })
	if (params.deployedBytecode !== undefined)
		requests.push({ method: 'anvil_setCode', params: [params.address, params.deployedBytecode] })
	for (const [slot, value] of Object.entries(params.storage ?? {}))
		requests.push({ method: 'anvil_setStorageAt', params: [params.address, slot, value] })
	for (const request of requests) await client.request(request)
}
