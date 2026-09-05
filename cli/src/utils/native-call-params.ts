import type { CallParams } from '@tevm/actions'

/** Convert CLI quantities to the native action contract. */
export function nativeCallParams(options: Record<string, any>): CallParams {
	return {
		...(options['to'] ? { to: options['to'] } : {}),
		...(options['from'] ? { from: options['from'] } : {}),
		...(options['data'] ? { data: options['data'] } : {}),
		...(options['blockTag'] ? { blockTag: options['blockTag'] } : {}),
		...Object.fromEntries(
			['value', 'gas', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce']
				.filter((key) => options[key] !== undefined && options[key] !== '')
				.map((key) => [key, BigInt(options[key])]),
		),
		...(options['submit'] ? { addToBlockchain: true } : {}),
		...(options['queue'] ? { addToMempool: true } : {}),
	}
}
