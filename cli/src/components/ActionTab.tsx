import { Box, Text } from 'ink'

type ActionTabProps<TProps extends { options: Record<string, unknown>; args: unknown[] }> = {
	actionName: string
	interactive: boolean
	rpcUrl: string
	ActionComponent: React.ComponentType<TProps>
}

function ActionTab<TProps extends { options: Record<string, unknown>; args: unknown[] }>({
	actionName,
	interactive,
	rpcUrl,
	ActionComponent,
}: ActionTabProps<TProps>) {
	if (!interactive) {
		return (
			<Box flexDirection="column">
				<Text bold>{actionName} Action</Text>
				<Text>Press Enter to use this action interactively</Text>
			</Box>
		)
	}

	const interactiveProps = {
		options: {
			interactive: true,
			rpc: rpcUrl,
			json: true,
		},
		args: [],
	} as unknown as TProps

	// Only render the actual action component when in interactive mode
	return <ActionComponent {...interactiveProps} />
}

export default ActionTab
