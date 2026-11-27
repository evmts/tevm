import { Flow } from '@smthrs/flow'
import { CiJob } from '@smthrs/sandbox'
import { Schema } from 'effect'

const uphillJob = CiJob.make('uphill', {
	steps: [
		{
			name: 'install-uphill',
			run: 'command -v uphill >/dev/null 2>&1 || curl -fsSL https://wevm.sh/uphill | sh',
		},
		{
			name: 'uphill-check',
			run: 'PATH="$HOME/.uphill/bin:$HOME/.bun/bin:$PATH" uphill check',
		},
		{
			name: 'uphill',
			run: 'PATH="$HOME/.uphill/bin:$HOME/.bun/bin:$PATH" uphill --compact',
		},
	],
})

export default Flow.make('uphill', {
	description: 'Score continuous footprint, quality, architecture, and factory health metrics with Uphill.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {
		compare: Schema.optional(Schema.String),
	},
	body: () => uphillJob.call(),
})
