import { Badge, Button, Eyebrow, KpiStat, StageStrip, StatusPill } from '@smthrs/ui'
import { ExternalAction } from '../components/ExternalAction'
import { factoryData } from '../data'

const lifecycle = [
	{ label: 'Intake', status: 'complete' },
	{ label: 'Triage', status: 'active' },
	{ label: 'Candidate', status: 'pending' },
	{ label: 'Approval', status: 'pending' },
	{ label: 'Pull request', status: 'pending' },
]

export const Hero = () => {
	const agenticEntries = factoryData.plugin.entries.filter((entry) => entry.agentic).length

	return (
		<section className="tevm-hero" id="overview">
			<div className="tevm-hero__noise" aria-hidden="true" />
			<div className="tevm-hero__copy">
				<div className="tevm-hero__status">
					<Eyebrow>Contributor control plane</Eyebrow>
					<StatusPill status="ready" label="factory ready" />
				</div>
				<h1>
					Ship a smaller,
					<br />
					<span>provable change.</span>
				</h1>
				<p className="tevm-hero__lead">
					Choose a structured issue, fork TEVM, and use the same local Smithers gates that review and automate the
					repository. Every agent candidate stays bounded and reviewable.
				</p>
				<div className="tevm-hero__actions">
					<ExternalAction href={factoryData.repository.forkUrl} variant="solid" size="lg">
						Fork TEVM
					</ExternalAction>
					<Button asChild variant="outline" size="lg">
						<a href="#issues">Choose an issue form ↓</a>
					</Button>
				</div>
				<div className="tevm-hero__meta">
					<Badge variant="outline">Node {factoryData.toolchain.node}</Badge>
					<Badge variant="outline">pnpm {factoryData.toolchain.pnpm}</Badge>
					<Badge variant="outline">local Flows</Badge>
				</div>
			</div>

			<div className="tevm-hero__panel">
				<div className="tevm-hero__panel-head">
					<div>
						<Eyebrow>Governed path</Eyebrow>
						<h2>Issue → evidence → candidate</h2>
					</div>
					<span className="tevm-live-dot" role="status" aria-label="Factory available" />
				</div>
				<StageStrip stages={lifecycle} showSummary summaryLabel="Example lifecycle" />
				<p className="tevm-hero__panel-note">
					The pink stage shows the active handoff in this example. A candidate cannot silently commit, push, fork, or
					open a pull request.
				</p>
				<div className="tevm-kpis">
					<KpiStat label="Issue routes" value={factoryData.issueTypes.length} hint="typed GitHub forms" />
					<KpiStat label="Agentic gates" value={agenticEntries} hint="diff-scoped review" />
					<KpiStat label="Guided lanes" value={factoryData.guidedWorkflows.length} hint="bounded candidates" />
					<KpiStat label="Settlement" value="Human" hint={factoryData.approvalLabel} />
				</div>
			</div>
		</section>
	)
}
