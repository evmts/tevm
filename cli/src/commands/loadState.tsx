import { readFileSync } from 'node:fs'
import type { Hex } from 'viem'

type LoadStateParams = { state: Hex }
type LoadStateResult = unknown

import { option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { envVar, useAction } from '../hooks/useAction.js'

// Add command description for help output
export const description =
	'Load saved state into the local EVM\nExample: tevm load-state --state-file state.json --rpc https://mainnet.optimism.io --run'

// Options definitions and descriptions
const optionDescriptions = {
	rpc: 'RPC endpoint (env: TEVM_RPC)',
	stateFile: 'Path to JSON file containing the TEVM state (env: TEVM_STATE_FILE)',
	stateJson: 'JSON string containing the TEVM state (env: TEVM_STATE_JSON)',
}

// Empty args tuple
export const args = z.tuple([])

export const options = z.object({
	// Interactive mode flag (run directly without interactive editor)
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
				description: optionDescriptions.rpc,
				defaultValueDescription: 'http://localhost:8545',
			}),
		),

	// State options - either file or JSON
	stateFile: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.stateFile,
			}),
		),
	stateJson: z
		.string()
		.optional()
		.describe(
			option({
				description: optionDescriptions.stateJson,
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
})

type Props = {
	args: z.infer<typeof args>
	options: z.infer<typeof options>
}

// Default values for all parameters
const defaultValues: Record<string, any> = {
	rpc: 'http://localhost:8545',
}

// Helper function to parse state
const parseState = (options: Record<string, any>): Hex => {
	// Try stateJson first
	if (options['stateJson']) {
		try {
			return JSON.parse(options['stateJson'])
		} catch (_e) {
			throw new Error('Invalid JSON in stateJson option')
		}
	}

	// Then try stateFile - in Node.js environment
	if (options['stateFile']) {
		try {
			return JSON.parse(readFileSync(options['stateFile'], 'utf8'))
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Could not read state file ${options['stateFile']}: ${message}`)
		}
	}

	throw new Error('Either stateFile or stateJson is required')
}

export default function LoadState({ options }: Props) {
	// Use the action hook with inlined createParams and executeAction
	const actionResult = useAction<LoadStateParams, LoadStateResult>({
		actionName: 'load-state',
		options,
		defaultValues,
		optionDescriptions,

		// Inlined createParams function - not async anymore
		createParams: (enhancedOptions: Record<string, any>): LoadStateParams => {
			// Parse the state synchronously
			const state = parseState(enhancedOptions)
			if (typeof state !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(state))
				throw new Error('State must be a JSON-encoded native hex blob')

			return {
				state,
			}
		},

		// Inlined executeAction function
		executeAction: async (client: any, params: LoadStateParams): Promise<LoadStateResult> => {
			return await client.tevmLoadState(params.state)
		},
	})

	// Render the action UI
	return <CliAction {...actionResult} targetName="load state" successMessage="State loaded successfully!" />
}
