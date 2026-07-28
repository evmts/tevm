import { readFileSync } from 'node:fs'
import path from 'node:path'
import { argument, option } from 'pastel'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'

export const description =
	'Compile a Solidity file, deploy it locally, and call one function\nExample: tevm sol Counter.sol --function number --json'

export const args = z.tuple([
	z.string().describe(
		argument({
			name: 'source',
			description: 'Path to one Solidity source file',
		}),
	),
])

export const options = z.object({
	function: z.string().describe(
		option({
			description: 'Function to call after deployment',
		}),
	),
	contract: z
		.string()
		.optional()
		.describe(
			option({
				description: 'Contract name when the source defines more than one contract',
			}),
		),
	args: z
		.string()
		.default('[]')
		.describe(
			option({
				description: 'Function arguments as a JSON array',
				defaultValueDescription: '[]',
			}),
		),
	constructorArgs: z
		.string()
		.default('[]')
		.describe(
			option({
				description: 'Constructor arguments as a JSON array',
				defaultValueDescription: '[]',
			}),
		),
	from: z
		.string()
		.default('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
		.describe(
			option({
				description: 'Impersonated caller and deployer',
			}),
		),
	run: z.boolean().default(true),
	local: z.boolean().default(true),
})

type Props = {
	args: z.infer<typeof args>
	options: z.infer<typeof options>
}

type SolParams = {
	source: string
	contract?: string
	functionName: string
	args: unknown[]
	constructorArgs: unknown[]
	from: `0x${string}`
}

type SolResult = {
	contract: string
	address: `0x${string}`
	data: unknown
	executionGasUsed: bigint
}

function parseArray(value: string, label: string): unknown[] {
	const parsed = JSON.parse(value)
	if (!Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON array`)
	}
	return parsed
}

export default function Sol({ args: [source], options }: Props) {
	const actionResult = useAction<SolParams, SolResult>({
		actionName: 'sol',
		options,
		defaultValues: {},
		optionDescriptions: {
			source: 'Solidity source file',
			contract: 'Contract name',
			functionName: 'Function name',
			args: 'Function arguments',
			constructorArgs: 'Constructor arguments',
			from: 'Impersonated caller and deployer',
		},
		createParams: (): SolParams => ({
			source,
			contract: options.contract,
			functionName: options.function,
			args: parseArray(options.args, 'args'),
			constructorArgs: parseArray(options.constructorArgs, 'constructorArgs'),
			from: options.from as `0x${string}`,
		}),
		executeAction: async (client: any, params: SolParams): Promise<SolResult> => {
			const solc = (await import('solc')).default
			const absoluteSource = path.resolve(params.source)
			const sourceName = path.basename(absoluteSource)
			const input = {
				language: 'Solidity',
				sources: {
					[sourceName]: { content: readFileSync(absoluteSource, 'utf8') },
				},
				settings: {
					outputSelection: {
						'*': {
							'*': ['abi', 'evm.bytecode'],
						},
					},
				},
			}
			const output = JSON.parse(solc.compile(JSON.stringify(input)))
			const errors = (output.errors ?? []).filter((error: { severity?: string }) => error.severity === 'error')
			if (errors.length > 0) {
				throw new Error(errors.map((error: { formattedMessage?: string }) => error.formattedMessage).join('\n'))
			}
			const contracts = output.contracts?.[sourceName] as Record<string, any> | undefined
			const contractName = params.contract ?? Object.keys(contracts ?? {})[0]
			const artifact = contractName ? contracts?.[contractName] : undefined
			if (!contractName || !artifact) {
				throw new Error(`No compiled contract found in ${params.source}`)
			}
			const deployment = await client.tevmDeploy({
				abi: artifact.abi,
				bytecode: `0x${artifact.evm.bytecode.object}`,
				args: params.constructorArgs,
				from: params.from,
				skipBalance: true,
			})
			if (!deployment.createdAddress) {
				throw new Error('Deployment did not return a contract address')
			}
			await client.tevmMine({ blockCount: 1 })
			const call = await client.tevmContract({
				abi: artifact.abi,
				functionName: params.functionName,
				args: params.args,
				to: deployment.createdAddress,
				from: params.from,
				skipBalance: true,
			})
			if (call.errors?.length) {
				throw new Error(call.errors.map((error: Error) => error.message).join('\n'))
			}
			return {
				contract: contractName,
				address: deployment.createdAddress,
				data: call.data,
				executionGasUsed: call.executionGasUsed,
			}
		},
	})

	if (actionResult.editorActive) {
		return null
	}
	return <CliAction {...actionResult} targetName={source} />
}
