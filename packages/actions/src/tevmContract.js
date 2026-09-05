import { decodeFunctionResult, encodeFunctionData } from 'viem'
import { tevmCall } from './tevmCall.js'

/**
 * ABI-encode a native call and decode its result.
 * @template {import('viem').Abi} TAbi
 * @template {import('viem').ContractFunctionName<TAbi>} TName
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {Omit<import('./TevmActions.js').CallParams, 'to' | 'data'> & {abi: TAbi, functionName: TName, args?: import('viem').ContractFunctionArgs<TAbi, 'pure' | 'view' | 'nonpayable' | 'payable', TName>, to?: import('viem').Address, address?: import('viem').Address}} params
 * @returns {Promise<import('./TevmActions.js').CallResult & {data?: import('viem').ContractFunctionReturnType<TAbi, 'pure' | 'view' | 'nonpayable' | 'payable', TName>}>}
 */
export const tevmContract = async (client, params) => {
	const to = params.to ?? params.address
	if (to === undefined) throw new TypeError('A contract address is required')
	const result = await tevmCall(client, {
		...params,
		to,
		data: encodeFunctionData(/** @type {import('viem').EncodeFunctionDataParameters} */ (params)),
	})
	if (result.txHash) return result
	return {
		...result,
		data: /** @type {import('viem').ContractFunctionReturnType<TAbi, 'pure' | 'view' | 'nonpayable' | 'payable', TName>} */ (
			decodeFunctionResult(
				/** @type {import('viem').DecodeFunctionResultParameters} */ ({
					abi: params.abi,
					functionName: params.functionName,
					data: result.rawData,
				}),
			)
		),
	}
}
