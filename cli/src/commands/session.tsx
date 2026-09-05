import { Text } from 'ink'
import { argument, option } from 'pastel'
import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { z } from 'zod'
import RawOutput from '../components/RawOutput.js'
import { formatJsonFailure, formatJsonSuccess } from '../utils/output.js'
import { type CliSession, parseSessionBlockNumber, readSession, writeSession } from '../utils/session.js'

export const description =
	'Create or inspect a persistent local fork session\nExample: tevm session optimism --fork https://mainnet.optimism.io --json'

export const args = z.tuple([
	z.string().describe(
		argument({
			name: 'name',
			description: 'Session name',
		}),
	),
])

export const options = z.object({
	fork: z
		.string()
		.optional()
		.describe(
			option({
				description: 'Fork RPC URL stored with a new session',
			}),
		),
	forkBlock: z
		.string()
		.optional()
		.describe(
			option({
				description: 'Pinned fork block number for reproducible reads',
			}),
		),
	local: z
		.boolean()
		.default(false)
		.describe(
			option({
				description: 'Create an unforked in-process EVM session',
			}),
		),
})

type Props = {
	args: z.infer<typeof args>
	options: z.infer<typeof options>
}

type SessionCommandState =
	| { status: 'loading' }
	| { status: 'done'; session: CliSession; path?: string }
	| { status: 'error'; error: Error }

export default function Session({ args: [name], options }: Props) {
	const [state, setState] = useState<SessionCommandState>({ status: 'loading' })

	useEffect(() => {
		let cancelled = false
		const createOrReadSession = async (): Promise<void> => {
			try {
				if (options.fork && options.local) {
					throw new Error('Choose either --fork or --local, not both')
				}
				if (options.forkBlock && !options.fork) {
					throw new Error('--fork-block requires --fork')
				}
				const requestedForkBlock = options.forkBlock
					? parseSessionBlockNumber(options.forkBlock, 'forkBlock').toString()
					: undefined
				const existing = readSession(name)
				if (existing) {
					if (options.fork && existing.forkUrl !== options.fork) {
						throw new Error(`Session "${name}" already exists with fork ${existing.forkUrl ?? '<none>'}`)
					}
					if (options.local && existing.forkUrl) {
						throw new Error(`Session "${name}" already exists with fork ${existing.forkUrl}`)
					}
					if (requestedForkBlock && existing.forkBlock !== requestedForkBlock) {
						throw new Error(`Session "${name}" already exists at fork block ${existing.forkBlock ?? '<unpinned>'}`)
					}
					if (!cancelled) {
						setState({ status: 'done', session: existing })
					}
					return
				}
				if (!options.fork && !options.local) {
					throw new Error(`Session "${name}" does not exist; pass --fork or --local to create it`)
				}
				const forkBlock =
					requestedForkBlock ??
					(options.fork
						? (await createPublicClient({ transport: http(options.fork) }).getBlockNumber()).toString()
						: undefined)
				const session: CliSession = {
					version: 2,
					name,
					...(options.fork ? { forkUrl: options.fork } : {}),
					...(forkBlock ? { forkBlock } : {}),
					blockNumber: '0',
					updatedAt: new Date().toISOString(),
				}
				const sessionPath = writeSession(session)
				if (!cancelled) {
					setState({ status: 'done', session, path: sessionPath })
				}
			} catch (error) {
				if (!cancelled) {
					process.exitCode = 1
					setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
				}
			}
		}
		void createOrReadSession()
		return () => {
			cancelled = true
		}
	}, [name, options.fork, options.forkBlock, options.local])

	if (state.status === 'loading') {
		return null
	}
	if (state.status === 'error') {
		if (process.env['TEVM_JSON'] === 'true') {
			return <RawOutput value={formatJsonFailure('session', state.error, name)} exitCode={1} />
		}
		return <Text color="red">{state.error.message}</Text>
	}
	if (process.env['TEVM_JSON'] === 'true') {
		return <RawOutput value={formatJsonSuccess('session', { ...state.session, path: state.path }, name)} />
	}
	return (
		<Text>
			Session {state.session.name}: {state.session.forkUrl ?? 'local EVM'}
			{state.session.forkBlock ? ` at block ${state.session.forkBlock}` : ''}
		</Text>
	)
}
