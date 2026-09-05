import { option } from 'pastel'
import { z } from 'zod'
import { createCommonOptions } from './options.js'

/** CLI flags supported by native simulation and transaction submission. */
export function nativeCallOptions() {
	const text = (description: string) => z.string().optional().describe(option({ description }))
	return {
		...createCommonOptions(),
		local: z
			.boolean()
			.default(false)
			.describe(option({ description: 'Use an isolated native node without a fork' })),
		to: text('Destination address'),
		from: text('Sender address; defaults to a native unlocked account for transactions'),
		data: text('Hexadecimal call data'),
		value: text('Value in wei'),
		gas: text('Gas limit'),
		gasPrice: text('Legacy gas price in wei'),
		maxFeePerGas: text('Maximum EIP-1559 fee per gas in wei'),
		maxPriorityFeePerGas: text('EIP-1559 priority fee per gas in wei'),
		nonce: text('Transaction nonce'),
		blockTag: text('Local block selector; simulations require current state'),
		submit: z
			.boolean()
			.default(false)
			.describe(option({ description: 'Submit and mine the transaction' })),
		queue: z
			.boolean()
			.default(false)
			.describe(option({ description: 'Queue a transaction for later mining' })),
	}
}
