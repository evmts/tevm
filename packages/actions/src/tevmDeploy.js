import { encodeDeployData } from 'viem'
import { tevmCall } from './tevmCall.js'

/**
 * Submit contract creation through ZEVM and mine it unless explicitly queued.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('./TevmActions.js').DeployParams} params
 * @returns {Promise<import('./TevmActions.js').CallResult & {createdAddress?: import('viem').Address}>}
 */
export async function tevmDeploy(client, params) {
	const result = await tevmCall(client, {
		...params,
		data: encodeDeployData({ abi: params.abi ?? [], bytecode: params.bytecode, args: params.args ?? [] }),
		addToBlockchain: !params.addToMempool,
	})
	const receipt = /** @type {{contractAddress?: import('viem').Address} | null | undefined} */ (result.receipt)
	return { ...result, ...(receipt?.contractAddress ? { createdAddress: receipt.contractAddress } : {}) }
}
