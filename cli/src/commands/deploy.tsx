import { z } from 'zod'
import CliAction from '../components/CliAction.js'
import { useAction } from '../hooks/useAction.js'
import { nativeCallOptions } from '../utils/native-call-options.js'
import { nativeCallParams } from '../utils/native-call-params.js'
import { parseCliAbi } from '../utils/parse-cli-abi.js'

export const description = 'Deploy bytecode through native ZEVM; --queue defers mining'
export const args = z.tuple([])
export const options = z.object({
	...nativeCallOptions(),
	bytecode: z.string(),
	abi: z.string().optional(),
	args: z.string().optional(),
})
type Props = { args: z.infer<typeof args>; options: z.infer<typeof options> }

export default function Deploy({ options }: Props) {
	const result = useAction({
		actionName: 'deploy',
		options,
		defaultValues: {},
		optionDescriptions: {},
		createParams: (input) => ({
			...nativeCallParams(input),
			bytecode: input['bytecode'],
			abi: parseCliAbi(input['abi']),
			args: JSON.parse(input['args'] ?? '[]'),
		}),
		executeAction: (client, params) => client.tevmDeploy(params),
	})
	return <CliAction {...result} targetName="deployment" successMessage="Deployment submitted" />
}
