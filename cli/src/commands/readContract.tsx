import { readFileSync } from 'node:fs'
import { option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'
import { ReadContractParams } from '../utils/action-types.js'

// Add command description for help output
export const description =
	'Read a decoded contract function\nExample: tevm read-contract --address 0x4200000000000000000000000000000000000006 --abi ./erc20.json --function-name name --rpc https://mainnet.optimism.io --run'

// Options definitions and descriptions
const optionDescriptions = {
	address: 'Contract address (env: TEVM_ADDRESS)',
	abi: 'Contract ABI as JSON string (env: TEVM_ABI)',
	functionName: 'Function name to call (env: TEVM_FUNCTION_NAME)',
	args: 'Function arguments as JSON array (env: TEVM_ARGS)',
	rpc: 'RPC endpoint (env: TEVM_RPC)',
	blockTag: 'Block tag (latest, pending, etc.) or number (env: TEVM_BLOCK_TAG)',
}

// Empty args tuple
export const args = z.tuple([])

export const options = z.object({
	// Contract details
	address: z.string().describe(
		option({
			description: optionDescriptions.address,
		}),
	),

	abi: z.string().describe(
		option({
			description: optionDescriptions.abi,
		}),
	),

	functionName: z.string().describe(
		option({
			description: optionDescriptions.functionName,
		}),
	),

	args: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.args,
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
		.default('http://localhost:8545')
		.describe(
			option({
				description: optionDescriptions.rpc,
				defaultValueDescription: 'http://localhost:8545',
			}),
		),

	// Block options
	blockTag: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.blockTag,
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

// Default ERC20 ABI to use as a fallback
const fallbackERC20Abi = [
	{
		inputs: [],
		name: 'totalSupply',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
]

export default function ReadContract({ options }: Props) {
	// Use the action hook for readContract
	const actionResult = useAction<ReadContractParams, any>({
		actionName: 'readContract',
		options,
		defaultValues: {
			blockTag: 'latest',
		},
		optionDescriptions,

		// Create params for readContract
		createParams: (enhancedOptions: Record<string, any>): ReadContractParams => {
			let abi
			try {
				const abiOption = (enhancedOptions as any).abi
				abi =
					typeof abiOption === 'string'
						? JSON.parse(abiOption.trim().startsWith('[') ? abiOption : readFileSync(abiOption, 'utf8'))
						: abiOption || fallbackERC20Abi
			} catch (e) {
				throw new Error(`Invalid ABI JSON: ${(e as Error).message}`)
			}

			let args = []
			if ((enhancedOptions as any).args) {
				try {
					args =
						typeof (enhancedOptions as any).args === 'string'
							? JSON.parse((enhancedOptions as any).args)
							: (enhancedOptions as any).args

					// Ensure args is an array
					if (!Array.isArray(args)) {
						args = [args]
					}
				} catch (e) {
					throw new Error(`Invalid arguments JSON: ${(e as Error).message}`)
				}
			}

			// Return the params object
			return {
				address: (enhancedOptions as any).address,
				abi,
				functionName: (enhancedOptions as any).functionName,
				args,
				blockTag: (enhancedOptions as any).blockTag,
			}
		},

		// Execute readContract action
		executeAction: async (client: any, params: ReadContractParams): Promise<any> => {
			return await client.readContract(params)
		},
	})

	// Render the action UI
	return (
		<CliAction
			{...actionResult}
			targetName={`${(actionResult.options as any).functionName} at ${(actionResult.options as any).address}`}
			successMessage="Contract read successfully!"
		/>
	)
}
