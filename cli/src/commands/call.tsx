import { toHex } from 'viem'
import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'
import { nativeCallOptions } from '../utils/native-call-options.js'
import { nativeCallParams } from '../utils/native-call-params.js'

export const description = 'Simulate or submit a native EVM call; --trace returns native opcode steps'
export const args = z.tuple([])
export const options = z.object({ ...nativeCallOptions(), trace: z.boolean().default(false) })
type Props = { args: z.infer<typeof args>; options: z.infer<typeof options> }

export default function Call({ options }: Props) {
	const result = useAction({
		actionName: 'call',
		options,
		defaultValues: {},
		optionDescriptions: {},
		createParams: nativeCallParams,
		executeAction: async (client, params) => {
			if (!options.trace) return client.tevmCall(params)
			if (params.addToBlockchain || params.addToMempool) throw new Error('Trace a simulation before submitting it')
			const tx = Object.fromEntries(
				Object.entries(params)
					.filter(([key]) => key !== 'blockTag')
					.map(([key, value]) => [key, typeof value === 'bigint' ? toHex(value) : value]),
			)
			return client.transport.tevm.request({ method: 'debug_traceCall', params: [tx, params.blockTag ?? 'latest'] })
		},
	})
	return <CliAction {...result} targetName="native call" successMessage="Call completed" />
}
