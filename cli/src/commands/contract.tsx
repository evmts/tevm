import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'
import { nativeCallOptions } from '../utils/native-call-options.js'
import { nativeCallParams } from '../utils/native-call-params.js'
import { parseCliAbi } from '../utils/parse-cli-abi.js'

export const description = 'Call an ABI contract function through native ZEVM'
export const args = z.tuple([])
export const options = z.object({
	...nativeCallOptions(),
	abi: z.string(),
	functionName: z.string(),
	args: z.string().optional(),
})
type Props = { args: z.infer<typeof args>; options: z.infer<typeof options> }

export default function Contract({ options }: Props) {
	const result = useAction({
		actionName: 'contract',
		options,
		defaultValues: {},
		optionDescriptions: {},
		createParams: (input) => ({
			...nativeCallParams(input),
			abi: parseCliAbi(input['abi']),
			functionName: input['functionName'],
			args: JSON.parse(input['args'] ?? '[]'),
		}),
		executeAction: (client, params) => client.tevmContract(params),
	})
	return <CliAction {...result} targetName="contract function" successMessage="Contract call completed" />
}
