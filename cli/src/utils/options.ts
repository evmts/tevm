/**
 * Utility functions for handling CLI options
 */

import { option } from 'pastel'
import { z } from 'zod'
import { envVar } from '../hooks/useAction.js'
import { commonOptionDescriptions } from './action-types.js'

/**
 * Creates common CLI options used by many commands
 */
export function createCommonOptions() {
	return {
		local: z
			.boolean()
			.default(false)
			.describe(option({ description: 'Use an isolated native node without a fork' })),
		// Interactive mode flag
		run: z
			.boolean()
			.default(false)
			.describe(
				option({
					description: 'Run directly without interactive parameter editing (env: TEVM_RUN)',
					alias: 'r',
				}),
			),

		// Transport options
		rpc: z
			.string()
			.default(envVar('rpc') || 'http://localhost:8545')
			.describe(
				option({
					description: commonOptionDescriptions.rpc,
					defaultValueDescription: 'http://localhost:8545',
				}),
			),

		// Output formatting
		json: z
			.boolean()
			.default(envVar('json') === 'true')
			.describe(
				option({
					description: 'Emit the stable machine-readable JSON envelope (env: TEVM_JSON)',
					defaultValueDescription: 'false',
				}),
			),
		session: z
			.string()
			.optional()
			.describe(
				option({
					description: 'Load and persist a named local fork session (env: TEVM_SESSION)',
				}),
			),
	}
}

/**
 * Creates options for address-based commands
 */
export function createAddressOptions() {
	return {
		address: z.string().describe(
			option({
				description: commonOptionDescriptions.address,
			}),
		),

		...createCommonOptions(),
	}
}

/**
 * Creates contract options for contract-related commands
 */
export function createContractOptions() {
	return {
		address: z.string().describe(
			option({
				description: commonOptionDescriptions.address,
			}),
		),

		abi: z.string().describe(
			option({
				description: commonOptionDescriptions.abi,
			}),
		),

		...createCommonOptions(),
	}
}

/**
 * Creates options for contract read operations
 */
export function createReadContractOptions() {
	return {
		address: z.string().describe(
			option({
				description: commonOptionDescriptions.address,
			}),
		),

		abi: z.string().describe(
			option({
				description: commonOptionDescriptions.abi,
			}),
		),

		functionName: z.string().describe(
			option({
				description: commonOptionDescriptions.functionName,
			}),
		),

		args: z
			.string()
			.optional()
			.describe(
				option({
					description: commonOptionDescriptions.args,
				}),
			),

		...createCommonOptions(),
	}
}
