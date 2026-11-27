import { Flow } from '@smthrs/flow'
import { Node } from '@smthrs/plan'
import { CiJob } from '@smthrs/sandbox'
import { Schema } from 'effect'

const uphillAuditJob = CiJob.make('uphill-lighthouse-audit', {
	steps: [
		{
			name: 'install-uphill',
			run: 'command -v uphill >/dev/null 2>&1 || curl -fsSL https://wevm.sh/uphill | sh',
		},
		{
			name: 'validate-metrics',
			run: 'PATH="$HOME/.uphill/bin:$HOME/.bun/bin:$PATH" uphill check',
		},
		{
			name: 'score-and-render-lighthouse-report',
			run: 'PATH="$HOME/.uphill/bin:$HOME/.bun/bin:$PATH" uphill --compact && test -f .uphill/report.html && test -f .uphill/report.json',
		},
	],
})

export default Flow.make('uphill', {
	description:
		'Run TEVM Lighthouse-style Backpressure Audit (Footprint, Quality, Architecture, and Factory Health) via Uphill.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {
		compare: Schema.optional(
			Schema.String.annotate({
				title: 'Compare ref',
				description: 'Optional git ref to compare metrics against (e.g. main)',
				default: 'main',
			}),
		),
	},
	body: () => uphillAuditJob.call(),
})
