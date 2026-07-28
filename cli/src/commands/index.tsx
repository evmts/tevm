import { Box, Text } from 'ink'
import RawOutput from '../components/RawOutput.js'
import { formatJsonSuccess } from '../utils/output.js'

// Add command description for help output
export const description =
	'In-process Ethereum CLI with persistent forks, readable traces, and typed JSON\nGlobal options: --json, --session <name>\nExample: tevm session optimism --fork https://mainnet.optimism.io --json'

export default function Index() {
	if (process.env['TEVM_JSON'] === 'true') {
		return <RawOutput value={formatJsonSuccess('index', { help: 'tevm --help' })} />
	}
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>TEVM CLI</Text>
			<Text>Run `tevm --help` to see available commands.</Text>
			<Box marginY={1}>
				<Text>Visit https://tevm.sh/ for documentation.</Text>
			</Box>
		</Box>
	)
}
