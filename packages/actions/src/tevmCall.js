import { toHex, zeroAddress } from 'viem'

/**
 * Simulate an EVM call, or submit and optionally mine a native transaction.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('./TevmActions.js').CallParams} params
 * @returns {Promise<import('./TevmActions.js').CallResult>}
 * @throws {Error} Native RPC diagnostic on failure. If a submitted transaction stays pending after mining or its
 * receipt indicates a revert, the error includes the submitted txHash and any reverted receipt.
 */
export async function tevmCall(client, params) {
	/** @type {Record<string, import('@tevm/node').JsonValue>} */
	const transaction = {}
	for (const key of /** @type {const} */ ([
		'to',
		'from',
		'data',
		'value',
		'gas',
		'gasPrice',
		'maxFeePerGas',
		'maxPriorityFeePerGas',
		'nonce',
	])) {
		const value = params[key]
		if (value !== undefined) transaction[key] = typeof value === 'bigint' ? toHex(value) : value
	}
	if (params.addToMempool || params.addToBlockchain) {
		if (params.code !== undefined) throw new TypeError('Runtime code overrides require a simulated call')
		if (transaction['from'] === undefined) {
			const accounts = /** @type {string[]} */ (await client.request({ method: 'eth_accounts' }))
			if (!accounts[0]) throw new Error('No accounts available. Supply a from address to submit a transaction.')
			transaction['from'] = accounts[0]
		}
		const txHash = /** @type {import('viem').Hex} */ (
			await client.request({ method: 'eth_sendTransaction', params: [transaction] })
		)
		if (!params.addToBlockchain) return { rawData: '0x', txHash }
		let receipt = await client.request({ method: 'eth_getTransactionReceipt', params: [txHash] })
		if (receipt === null) {
			await client.request({ method: 'evm_mine' })
			receipt = await client.request({ method: 'eth_getTransactionReceipt', params: [txHash] })
		}
		if (receipt === null) throw Object.assign(new Error(`Transaction ${txHash} was not mined`), { txHash })
		if (typeof receipt === 'object' && 'status' in receipt && receipt['status'] === '0x0')
			throw Object.assign(new Error(`Transaction ${txHash} reverted`), { txHash, receipt })
		return { rawData: '0x', txHash, receipt }
	}
	let overrides = params.stateOverride
	if (params.code !== undefined) {
		const to = params.to ?? zeroAddress
		transaction['to'] = to
		const key = Object.keys(overrides ?? {}).find((address) => address.toLowerCase() === to.toLowerCase()) ?? to
		const account = overrides?.[key]
		if (account !== undefined && (account === null || typeof account !== 'object' || Array.isArray(account)))
			throw new TypeError('Expected an account object in stateOverride')
		overrides = { ...overrides, [key]: { ...account, code: params.code } }
	}
	const rawData = /** @type {import('viem').Hex} */ (
		await client.request({
			method: 'eth_call',
			params: [transaction, params.blockTag ?? 'latest', ...(overrides === undefined ? [] : [overrides])],
		})
	)
	return { rawData }
}
