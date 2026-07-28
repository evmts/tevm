import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { option } from 'pastel'
import { useEffect, useRef, useState } from 'react'
import zod from 'zod'
import RawOutput from '../components/RawOutput.js'
import { formatJsonFailure, formatJsonSuccess } from '../utils/output.js'

const require = createRequire(import.meta.url)

// Add command description for help output
export const description =
	"Compile TypeScript with TEVM's plugin\nExample: tevm tsc --project ./tsconfig.json --check --json"

export const options = zod.object({
	watch: zod
		.boolean()
		.default(false)
		.describe(
			option({
				description: 'Watch for changes',
				alias: 'w',
			}),
		),
	project: zod
		.string()
		.optional()
		.describe(
			option({
				description: 'Path to tsconfig.json',
			}),
		),
	check: zod
		.boolean()
		.default(false)
		.describe(
			option({
				description: 'Type-check without emitting outputs',
				alias: 'n',
			}),
		),
})

type Props = {
	options: zod.infer<typeof options>
}

type TscState = {
	status: 'running' | 'done' | 'error'
	lines: string[]
	exitCode?: number
}

export default function Tsc({ options }: Props) {
	const [state, setState] = useState<TscState>({ status: 'running', lines: [] })
	const processRef = useRef<ChildProcessWithoutNullStreams | null>(null)

	useEffect(() => {
		const args: string[] = []
		if (options.project) {
			args.push('--project', options.project)
		}
		if (options.watch) {
			args.push('--watch')
		}
		if (options.check) {
			args.push('--noEmit')
		}

		const tscPath = require.resolve('typescript/bin/tsc')
		const child = spawn(process.execPath, [tscPath, ...args])
		processRef.current = child

		const appendOutput = (data: Buffer) => {
			const text = data.toString()
			if (text.length === 0) {
				return
			}
			setState((current) => ({ ...current, lines: [...current.lines, text] }))
		}

		child.stdout.on('data', appendOutput)
		child.stderr.on('data', appendOutput)
		;(child as any).on('error', (error: Error) => {
			process.exitCode = 1
			setState((current) => ({ status: 'error', lines: [...current.lines, error.message], exitCode: 1 }))
		})
		;(child as any).on('exit', (code: number | null) => {
			const exitCode = code ?? 1
			if (exitCode !== 0) {
				process.exitCode = exitCode
			}
			setState((current) => ({
				status: exitCode === 0 ? 'done' : 'error',
				lines: current.lines,
				exitCode,
			}))
		})

		return () => {
			processRef.current?.kill()
			processRef.current = null
		}
	}, [options.check, options.project, options.watch])

	const output = state.lines.join('').trim()

	if (state.status === 'running') {
		return (
			<Box flexDirection="column">
				<Text>
					<Spinner type="dots" /> Running TypeScript compiler...
				</Text>
				{output ? <Text>{output}</Text> : null}
			</Box>
		)
	}

	if (process.env['TEVM_JSON'] === 'true') {
		return state.status === 'done' ? (
			<RawOutput value={formatJsonSuccess('tsc', { exitCode: state.exitCode ?? 0, output })} />
		) : (
			<RawOutput
				value={formatJsonFailure('tsc', new Error(output || `TypeScript exited with ${state.exitCode ?? 1}`))}
				exitCode={state.exitCode ?? 1}
			/>
		)
	}

	return (
		<Box flexDirection="column">
			{output ? <Text>{output}</Text> : null}
			<Text color={state.status === 'done' ? 'green' : 'red'}>
				TypeScript compiler {state.status === 'done' ? 'completed' : `failed with exit code ${state.exitCode ?? 1}`}
			</Text>
		</Box>
	)
}
