import { option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'

// Add command description for help output
export const description =
	'Set a contract storage slot in local state\nExample: tevm set-storage-at --address 0x0000000000000000000000000000000000000001 --index 0x0 --value 0x01 --session demo --run'

// Options definitions and descriptions
const optionDescriptions = {
	address: 'Contract address to set storage for (env: TEVM_ADDRESS)',
	index: 'Storage slot index (env: TEVM_INDEX)',
	value: 'Value to set at the storage slot (env: TEVM_VALUE)',
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

	index: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.index,
			}),
		),

	value: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.value,
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
	address: '0x0000000000000000000000000000000000000000',
	index: '0x0',
	value: '0x1',
	rpc: 'http://localhost:8545',
}

// Helper function to ensure a 32-byte hex word
const ensureHex = (value?: string): `0x${string}` => {
	if (!value) return `0x${'0'.repeat(64)}`

	let hex: string
	try {
		hex = value.startsWith('0x') ? value.slice(2) : BigInt(value).toString(16)
	} catch (_e) {
		hex = value.startsWith('0x') ? value.slice(2) : value
	}
	if (!/^[0-9a-fA-F]+$/.test(hex)) {
		throw new Error(`Storage word must be hexadecimal or a non-negative decimal integer: ${value}`)
	}
	if (hex.length > 64) {
		throw new Error(`Storage word is longer than 32 bytes: ${value}`)
	}
	return `0x${hex.padStart(64, '0')}`
}

export default function SetStorageAt({ options }: Props) {
	// Use the action hook
	const actionResult = useAction({
		actionName: 'setStorageAt',
		options,
		defaultValues,
		optionDescriptions,

		// Create params
		createParams: (enhancedOptions: Record<string, any>) => {
			return {
				address: enhancedOptions['address'] || defaultValues['address'],
				index: ensureHex(enhancedOptions['index'] || defaultValues['index']),
				value: ensureHex(enhancedOptions['value'] || defaultValues['value']),
			}
		},

		// Execute the action
		executeAction: async (client: any, params: any): Promise<any> => {
			return await client.tevmSetAccount({
				address: params.address,
				stateDiff: {
					[params.index]: params.value,
				},
			})
		},
	})

	// If editor is active, render nothing
	if (actionResult.editorActive) {
		return null
	}

	return (
		<CliAction
			{...actionResult}
			targetName={`storage slot ${actionResult.options['index'] || '0x0'} at ${actionResult.options['address'] || '0x0000...0000'}`}
			successMessage="Storage value set successfully!"
		/>
	)
}
