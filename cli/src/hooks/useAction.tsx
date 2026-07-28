/**
 * Hook for executing Tevm actions with interactive capabilities
 */

import { useQuery } from '@tanstack/react-query'
import { http } from '@tevm/jsonrpc'
import { createMemoryClient } from '@tevm/memory-client'
import JSONBig from 'json-bigint'
import React from 'react'

import { isViemAction, loadViemClient } from '../utils/clients.js'
import { cleanupProject, createEditorProject, executeTsFile, openEditor, waitForDependencies } from '../utils/editor.js'
import { shouldRunDirectly } from '../utils/global-options.js'
import { formatHumanResult, formatJsonFailure, formatJsonSuccess } from '../utils/output.js'
import { normalizeSessionState, readSession, restoreSessionBlockNumber, writeSession } from '../utils/session.js'

// Configure JSON BigInt for handling large numbers
const JSON_BIG = JSONBig({
	useNativeBigInt: true, // Use native BigInt
	alwaysParseAsBig: true, // Parse all numbers as BigInt for consistency
	protoAction: 'ignore', // Security: ignore __proto__ properties
	constructorAction: 'ignore', // Security: ignore constructor properties
})

/**
 * Helper function to load options from environment variables
 * @param {string} name - The name of the environment variable (without prefix)
 * @param {string} prefix - The prefix to use (default: TEVM_)
 * @returns {string|undefined} - The value from the environment variable or undefined if not set
 */
export const envVar = (name: string, prefix = 'TEVM_'): string | undefined => {
	// Check import.meta.env first (for browser environments), then fall back to process.env
	const importMetaEnv = import.meta.env as Record<string, string | undefined>
	return importMetaEnv?.[`${prefix}${name.toUpperCase()}`] || process.env[`${prefix}${name.toUpperCase()}`]
}

/**
 * Options for the useAction hook
 */
export interface UseActionOptions<TParams, TResult> {
	/** Action name to execute */
	actionName: string

	/** Options passed from the command line */
	options: Record<string, any>

	/** Default values for unspecified options */
	defaultValues: Record<string, any>

	/** Descriptions for each option (used for help text) */
	optionDescriptions: Record<string, string>

	/** Function to create action parameters from options */
	createParams: (options: Record<string, any>) => TParams | Promise<TParams>

	/** Function to execute the action using the client */
	executeAction: (client: any, params: TParams) => Promise<TResult>
}

/**
 * Hook for TEVM CLI actions with interactive parameter editing
 *
 * This hook provides two execution paths:
 * 1. Interactive - Opens an editor for the user to modify parameters
 * 2. Direct - Executes the action with the provided parameters
 */
export function useAction<TParams, TResult>({
	actionName,
	options,
	defaultValues,
	optionDescriptions,
	executeAction,
	createParams,
}: UseActionOptions<TParams, TResult>) {
	// Apply environment variables as fallbacks for options that aren't set via CLI
	const baseOptions = React.useMemo(() => {
		// Start with the provided options
		const enhancedOptions = { ...options }

		// Add environment variable fallbacks for each option
		Object.keys(optionDescriptions).forEach((key) => {
			const envKey = key.replace(/([A-Z])/g, '_$1').toLowerCase() // Convert camelCase to snake_case for env vars
			enhancedOptions[key] = options[key] ?? envVar(envKey) ?? defaultValues[key] ?? undefined
		})
		enhancedOptions['json'] = options['json'] === true || envVar('json') === 'true'
		enhancedOptions['session'] = options['session'] ?? envVar('session')

		return enhancedOptions
	}, [options, optionDescriptions, defaultValues])
	const runDirectly = shouldRunDirectly(baseOptions)

	// Use refs to track state that shouldn't trigger re-renders
	const editorOpenedRef = React.useRef(false)
	const editorInProgressRef = React.useRef(false)
	const projectDirRef = React.useRef<string | null>(null)

	// Track if we're in the editor session - used to prevent rendering UI during editing
	const [editorActive, setEditorActive] = React.useState(false)

	// Interactive editor query - only runs when run flag is false
	const {
		data: interactiveResult,
		isLoading: isInteractiveLoading,
		error: interactiveError,
	} = useQuery({
		queryKey: [`interactive-editor-${actionName}`, JSON_BIG.stringify(baseOptions)],
		queryFn: async () => {
			try {
				// Don't run again if we've already opened the editor
				if (editorOpenedRef.current) {
					return projectDirRef.current ? await executeTsFile(projectDirRef.current) : null
				}

				// Set editor opened ref immediately to prevent reruns
				editorOpenedRef.current = true

				// Create the TypeScript project
				const projectDir = await createEditorProject(actionName, baseOptions, createParams)

				// Store the project directory for cleanup and reuse
				projectDirRef.current = projectDir

				// THIS IS CRITICAL: Set the editor active flag before opening the editor
				// to prevent any React UI rendering during the editor session
				setEditorActive(true)
				editorInProgressRef.current = true

				// Open the editor and wait for it to close
				const editorExitCode = await openEditor(projectDir)
				if (editorExitCode !== 0) {
					throw new Error(`Editor exited with code ${editorExitCode}`)
				}

				// Editor is now closed
				editorInProgressRef.current = false
				setEditorActive(false)

				// Wait for dependencies to be installed
				await waitForDependencies(projectDir)

				// Execute the edited file
				return await executeTsFile(projectDir)
			} catch (error) {
				// Make sure we reset the editor state on error
				editorInProgressRef.current = false
				setEditorActive(false)
				console.error('Error in interactive editor:', error)
				throw error
			}
		},
		enabled: !runDirectly,
		retry: false,
	})

	// Direct action execution query - only runs when run flag is true
	const { isLoading: isActionLoading, data: actionOutcome } = useQuery({
		queryKey: [actionName, JSON_BIG.stringify(baseOptions)],
		queryFn: async () => {
			try {
				let client
				const sessionName =
					typeof baseOptions['session'] === 'string' && baseOptions['session'].length > 0
						? baseOptions['session']
						: undefined
				const session = sessionName ? readSession(sessionName) : undefined
				if (sessionName && !session) {
					throw new Error(`Session "${sessionName}" does not exist; create it with tevm session ${sessionName} --local`)
				}
				const local = baseOptions['local'] === true || (sessionName !== undefined && session?.forkUrl === undefined)
				const rpcUrl = session?.forkUrl || (local ? undefined : baseOptions['rpc'] || 'http://localhost:8545')
				let forkBlock = session?.forkBlock

				// Create the appropriate client based on action type
				if (isViemAction(actionName) && !sessionName) {
					client = await loadViemClient(rpcUrl || 'http://localhost:8545')
					if (!client) {
						throw new Error('Failed to create Viem client')
					}
				} else {
					client = createMemoryClient(
						rpcUrl
							? {
									loggingLevel: 'fatal',
									fork: {
										transport: http(rpcUrl),
										...(session?.forkBlock ? { blockTag: BigInt(session.forkBlock) } : {}),
									},
								}
							: { loggingLevel: 'fatal' },
					)
					await client.tevmReady()
					if (sessionName && rpcUrl && !forkBlock) {
						forkBlock = (await client.getBlockNumber()).toString()
					}
					if (session?.state) {
						await client.tevmLoadState(normalizeSessionState(session.state) as any)
					}
					if (session) {
						await restoreSessionBlockNumber(client, session)
					}
				}

				// Create the parameters and execute the action
				const params = await createParams(baseOptions)
				const actionResult = await executeAction(client, params)
				if (sessionName) {
					const sessionClient = client as any
					const state = await sessionClient.tevmDumpState()
					const blockNumber = (await sessionClient.getBlockNumber()).toString()
					writeSession({
						version: 1,
						name: sessionName,
						...(rpcUrl ? { forkUrl: rpcUrl } : {}),
						...(forkBlock ? { forkBlock } : {}),
						blockNumber,
						updatedAt: new Date().toISOString(),
						state: state as unknown as Record<string, unknown>,
					})
				}
				return { result: (actionResult === undefined ? {} : actionResult) as TResult }
			} catch (error) {
				const normalizedError =
					error instanceof Error
						? error
						: new Error(
								error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error),
							)
				return { error: normalizedError }
			}
		},
		enabled: runDirectly,
		retry: false,
	})
	const result = actionOutcome?.result
	const actionError = actionOutcome?.error ?? null

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			if (projectDirRef.current) {
				cleanupProject(projectDirRef.current)
			}
		}
	}, [])

	// Determine the final result based on either interactive or direct execution
	const finalResult = interactiveResult ?? result
	const commandName = actionName
		.replace(/^tevm/, '')
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/^-/, '')
		.toLowerCase()
	const sessionName = typeof baseOptions['session'] === 'string' ? baseOptions['session'] : undefined
	const formattedResult =
		finalResult === undefined || finalResult === null
			? undefined
			: baseOptions['json'] === true
				? formatJsonSuccess(commandName, finalResult, sessionName)
				: formatHumanResult(commandName, finalResult, baseOptions)
	const error = interactiveError ?? actionError
	const formattedError =
		error && baseOptions['json'] === true ? formatJsonFailure(commandName, error, sessionName) : undefined

	// If editor is active, return an object indicating not to render anything
	if (editorActive || editorInProgressRef.current) {
		return {
			formattedResult: undefined,
			isInteractiveLoading: false,
			isActionLoading: false,
			isInstallingDeps: false,
			interactiveError: null,
			actionError: null,
			formattedError: undefined,
			actionName: commandName,
			options: baseOptions,
			editorActive: true,
		}
	}

	return {
		// Results
		formattedResult,

		// Loading states
		isInteractiveLoading: isInteractiveLoading && !editorActive,
		isActionLoading,
		isInstallingDeps: isInteractiveLoading && !editorActive,

		// Errors
		interactiveError: interactiveError as Error | null,
		actionError: actionError as Error | null,
		formattedError,
		actionName: commandName,

		// Options
		options: baseOptions,
		editorActive: false,
	}
}
