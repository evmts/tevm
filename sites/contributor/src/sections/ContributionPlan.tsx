import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CodeBlock,
	Plan,
	SectionHeader,
} from '@smthrs/ui'
import { ExternalAction } from '../components/ExternalAction'
import { sectionTitle } from '../components/sectionTitle'
import { factoryData } from '../data'

const contributionSteps = [
	{
		id: 'fork',
		label: 'Fork TEVM under your GitHub account',
		status: 'pending' as const,
		detail: 'The fork button is an explicit GitHub action. This portal never creates a fork on your behalf.',
	},
	{
		id: 'bootstrap',
		label: 'Clone your fork and bootstrap pinned local dependencies',
		status: 'pending' as const,
		detail: `Node ${factoryData.toolchain.node}, pnpm ${factoryData.toolchain.pnpm}, local Flows, and Zevm are checked before work starts.`,
	},
	{
		id: 'prove',
		label: 'Run the smallest affected target, then the factory contract',
		status: 'pending' as const,
		detail: 'Plan expensive targets first. Use the deterministic gate before spending an agent seat.',
	},
	{
		id: 'review',
		label: 'Run agentic review on the applied diff',
		status: 'pending' as const,
		detail:
			'Wire contracts, regression proof, public exports, docs, changesets, and semantic scope are reviewed together.',
	},
	{
		id: 'propose',
		label: 'Push your branch and open a pull request explicitly',
		status: 'pending' as const,
		detail: 'Candidate generation and outward settlement remain separate actions with separate authority.',
	},
]

export const ContributionPlan = () => (
	<section className="tevm-section tevm-start" id="start">
		<SectionHeader eyebrow="Local-first workflow" title={sectionTitle(<h2>Fork, prove, propose</h2>)}>
			<p>The browser provides the map. Your checkout owns execution, diffs, secrets, and approval.</p>
		</SectionHeader>

		<div className="tevm-start__grid">
			<Card className="tevm-start__plan">
				<CardHeader>
					<div>
						<CardTitle>Contributor path</CardTitle>
						<CardDescription>Five visible handoffs from fork to review.</CardDescription>
					</div>
					<Badge variant="success">non-custodial</Badge>
				</CardHeader>
				<CardContent>
					<Plan title="Your first TEVM change" steps={contributionSteps} defaultOpen />
				</CardContent>
			</Card>

			<div className="tevm-start__commands">
				<Card>
					<CardHeader>
						<div>
							<CardTitle>1. Create your fork</CardTitle>
							<CardDescription>GitHub opens in a new tab and asks you to confirm.</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<ExternalAction href={factoryData.repository.forkUrl} variant="solid">
							Fork on GitHub
						</ExternalAction>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div>
							<CardTitle>2. Clone and bootstrap</CardTitle>
							<CardDescription>Replace the handle placeholder with your GitHub account.</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<CodeBlock code={factoryData.commands.clone} language="shell" defaultWrap />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div>
							<CardTitle>3. Prove the factory</CardTitle>
							<CardDescription>Model-free graph, candidate, and write-set validation.</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<CodeBlock
							code={`${factoryData.commands.factoryCheck}\n${factoryData.commands.runtimeCheck}`}
							language="shell"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	</section>
)
