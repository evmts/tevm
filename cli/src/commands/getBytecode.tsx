import { option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'

// Add command description for help output
export const description =
	'Get deployed bytecode at an address\nExample: tevm get-bytecode --address 0x4200000000000000000000000000000000000006 --rpc https://mainnet.optimism.io --run'

// Options definitions and descriptions
const optionDescriptions = {
	address: 'Contract address to get bytecode for (env: TEVM_ADDRESS)',
	blockTag: 'Block tag (latest, pending, etc.) (env: TEVM_BLOCK_TAG)',
	blockNumber: 'Block number to get bytecode at (env: TEVM_BLOCK_NUMBER)',
	rpc: 'RPC endpoint (env: TEVM_RPC)',
}

// Empty args tuple
export const args = z.tuple([])

export const options = z.object({
	// ALL PARAMETERS OPTIONAL
	address: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.address,
			}),
		),

	blockTag: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.blockTag,
			}),
		),

	blockNumber: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.blockNumber,
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

// Comprehensive defaults
const defaultValues: Record<string, any> = {
	address: '0x0000000000000000000000000000000000000000',
	blockTag: 'latest',
	rpc: 'http://localhost:8545',
}

// Helper function to safely parse block number
const parseBlockNumber = (blockNumber?: string): bigint | undefined => {
	if (!blockNumber) return undefined
	try {
		return BigInt(blockNumber)
	} catch (_e) {
		throw new Error(`Invalid block number "${blockNumber}"`)
	}
}

export default function GetBytecode({ options }: Props) {
	// Use the action hook
	const actionResult = useAction({
		actionName: 'getBytecode',
		options,
		defaultValues,
		optionDescriptions,

		// Create params
		createParams: (enhancedOptions: Record<string, any>) => {
			const params: Record<string, any> = {
				address: enhancedOptions['address'] || defaultValues['address'],
			}

			// Add block identifier - only one should be used
			if (enhancedOptions['blockNumber']) {
				params['blockNumber'] = parseBlockNumber(enhancedOptions['blockNumber'])
			} else if (enhancedOptions['blockTag']) {
				params['blockTag'] = enhancedOptions['blockTag']
			}

			return params
		},

		// Execute the action
		executeAction: async (client: any, params: any): Promise<any> => {
			if (typeof client.tevmGetAccount === 'function') {
				const account = await client.tevmGetAccount({
					address: params.address,
					returnStorage: false,
				})
				return account.deployedBytecode
			}
			return await client.getBytecode(params)
		},
	})

	// If editor is active, render nothing
	if (actionResult.editorActive) {
		return null
	}

	return (
		<CliAction
			{...actionResult}
			targetName={`contract at ${actionResult.options['address'] || '0x0000...0000'}`}
			successMessage="Contract bytecode retrieved successfully!"
		/>
	)
}
