import { option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'

// Add command description for help output
export const description = 'Get the chain ID\nExample: tevm get-chain-id --rpc https://mainnet.optimism.io --run --json'

// Options definitions and descriptions
const optionDescriptions = {
	rpc: 'RPC endpoint (env: TEVM_RPC)',
}

// Empty args tuple
export const args = z.tuple([])

export const options = z.object({
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
	rpc: 'http://localhost:8545',
}

export default function GetChainId({ options }: Props) {
	// Use the action hook
	const actionResult = useAction({
		actionName: 'getChainId',
		options,
		defaultValues,
		optionDescriptions,

		// Create params - getChainId takes no parameters
		createParams: (_enhancedOptions: Record<string, any>) => {
			return {}
		},

		// Execute the action
		executeAction: async (client: any, _params: any): Promise<any> => {
			return await client.getChainId()
		},
	})

	// If editor is active, render nothing
	if (actionResult.editorActive) {
		return null
	}

	return <CliAction {...actionResult} targetName="chain" successMessage="Chain ID retrieved successfully!" />
}
