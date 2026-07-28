import { option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'

// Add command description for help output
export const description =
	'Get a transaction by hash\nExample: tevm get-transaction --hash 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef --rpc https://mainnet.optimism.io --run'

// Options definitions and descriptions
const optionDescriptions = {
	hash: 'Transaction hash to get information for (env: TEVM_HASH)',
	rpc: 'RPC endpoint (env: TEVM_RPC)',
}

// Empty args tuple
export const args = z.tuple([])

export const options = z.object({
	// ALL PARAMETERS OPTIONAL
	hash: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.hash,
			}),
		),

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
		.optional()
		.describe(
			option({
				description: optionDescriptions.rpc,
				defaultValueDescription: 'http://localhost:8545',
			}),
		),

	// Output formatting
	json: z
		.boolean()
		.optional()
		.describe(
			option({
				description: 'Emit the stable machine-readable JSON envelope (env: TEVM_JSON)',
				defaultValueDescription: 'false',
			}),
		),
})

type Props = {
	args: z.infer<typeof args>
	options: z.infer<typeof options>
}

// COMPREHENSIVE DEFAULTS
const defaultValues: Record<string, any> = {
	hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
	rpc: 'http://localhost:8545',
}

export default function GetTransaction({ options }: Props) {
	// Use the action hook
	const actionResult = useAction({
		actionName: 'getTransaction',
		options,
		defaultValues,
		optionDescriptions,

		// Create params
		createParams: (enhancedOptions: Record<string, any>) => {
			return {
				hash: enhancedOptions['hash'] || defaultValues['hash'],
			}
		},

		// Execute the action
		executeAction: async (client: any, params: any): Promise<any> => {
			return await client.getTransaction(params)
		},
	})

	// If editor is active, render nothing
	if (actionResult.editorActive) {
		return null
	}

	return (
		<CliAction
			{...actionResult}
			targetName={`transaction ${actionResult.options['hash'] ? `${actionResult.options['hash'].substring(0, 10)}...` : '0x0000...0000'}`}
			successMessage="Transaction details retrieved successfully!"
		/>
	)
}
