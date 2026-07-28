import { Box, Text, useApp } from 'ink'
import Spinner from 'ink-spinner'
import { useEffect } from 'react'
import RawOutput from './RawOutput.js'

export interface CliActionProps {
	// Results
	formattedResult?: string
	formattedError?: string

	// Loading states
	isInteractiveLoading?: boolean
	isActionLoading?: boolean
	isInstallingDeps?: boolean

	// Errors
	interactiveError?: Error | null
	actionError?: Error | null

	// Options and context
	options?: Record<string, any>
	actionName?: string
	targetName?: string // Name of the target (address, contract, etc.)
	successMessage?: string

	// Editor state
	editorActive?: boolean
}

export default function CliAction({
	formattedResult,
	formattedError,
	isInteractiveLoading,
	isActionLoading,
	isInstallingDeps,
	interactiveError,
	actionError,
	targetName,
	options,
	editorActive = false,
}: CliActionProps) {
	const { exit } = useApp()
	const error = interactiveError || actionError
	const isJson = options?.['json'] === true

	useEffect(() => {
		if (!error || formattedError) {
			return
		}

		process.exitCode = 1
		const timeout = setTimeout(() => exit(error), 0)
		return () => clearTimeout(timeout)
	}, [error, exit, formattedError])

	// If editor is active, render absolutely nothing
	if (editorActive) {
		return null
	}

	// Priority 1: Show dependency installation
	if (isInstallingDeps) {
		return (
			<Box>
				<Text>
					<Spinner type="dots" /> Installing dependencies...
				</Text>
			</Box>
		)
	}

	// Priority 2: Show loading state
	if (isInteractiveLoading || isActionLoading) {
		return (
			<Box>
				<Text>
					<Spinner type="dots" /> {isActionLoading && targetName ? `Processing ${targetName}...` : 'Processing...'}
				</Text>
			</Box>
		)
	}

	// Priority 3: Show errors if present
	if (error) {
		if (formattedError) {
			return <RawOutput value={formattedError} exitCode={1} />
		}
		return (
			<Box>
				<Text color="red">{(error as Error).message || 'An error occurred'}</Text>
			</Box>
		)
	}

	// Priority 4: Show just the result
	if (formattedResult) {
		if (isJson) {
			return <RawOutput value={formattedResult} />
		}
		return (
			<Box>
				<Text>{formattedResult}</Text>
			</Box>
		)
	}

	// Fallback (should rarely happen)
	return null
}
