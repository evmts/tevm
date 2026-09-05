import { toHex } from 'viem'

/**
 * Simulate an EVM call, or submit and optionally mine a native transaction.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('./TevmActions.js').CallParams} params
 * @returns {Promise<import('./TevmActions.js').CallResult>}
 * @throws {Error} Native RPC error, including revert data, on failure.
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
		if (transaction['from'] === undefined) {
			const accounts = /** @type {string[]} */ (await client.request({ method: 'eth_accounts' }))
			transaction['from'] = accounts[0] ?? ''
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
		return { rawData: '0x', txHash, receipt }
	}
	const rawData = /** @type {import('viem').Hex} */ (
		await client.request({
			method: 'eth_call',
			params: [
				transaction,
				params.blockTag ?? 'latest',
				...(params.stateOverride === undefined ? [] : [params.stateOverride]),
			],
		})
	)
	return { rawData }
}
