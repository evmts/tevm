import { Box, Text } from 'ink'
import RawOutput from '../../components/RawOutput.js'
import { formatJsonSuccess } from '../../utils/output.js'

// Add command description for help output
export const description =
	'Execute grouped Ethereum actions\nExample: tevm action get-balance --address 0x4200000000000000000000000000000000000006 --rpc https://mainnet.optimism.io --run'

export default function Action() {
	if (process.env['TEVM_JSON'] === 'true') {
		return <RawOutput value={formatJsonSuccess('action', { help: 'tevm action --help' })} />
	}
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>TEVM Action Commands</Text>
			<Text>Run `tevm action --help` to see available action subcommands.</Text>
			<Box marginY={1}>
				<Text>Available actions include: simulateCalls, sendRawTransaction, createAccessList, getBalance</Text>
			</Box>
		</Box>
	)
}
