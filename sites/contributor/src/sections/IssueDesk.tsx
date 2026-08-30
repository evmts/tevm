import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	SectionHeader,
} from '@smthrs/ui'
import { ExternalAction, ExternalTextLink } from '../components/ExternalAction'
import { sectionTitle } from '../components/sectionTitle'
import { factoryData } from '../data'

const issueMarks: Record<string, string> = {
	bug: 'B',
	feature: 'F',
	docs: 'D',
	conformance: 'C',
	maintenance: 'M',
}

const routeLabel = (route: string) => route.replaceAll('-', ' ')

export const IssueDesk = () => (
	<section className="tevm-section" id="issues">
		<SectionHeader
			eyebrow="Start with a contract"
			title={sectionTitle(<h2>Open the right kind of issue</h2>)}
			actions={<ExternalTextLink href={factoryData.repository.newIssueUrl}>All issue options</ExternalTextLink>}
		>
			<p>Required fields become acceptance evidence; issue text never becomes trusted agent instruction.</p>
		</SectionHeader>

		<div className="tevm-issue-grid">
			{factoryData.issueTypes.map((issue) => (
				<Card className="tevm-issue-card" data-issue={issue.id} key={issue.id}>
					<CardHeader>
						<span className="tevm-issue-mark" aria-hidden="true">
							{issueMarks[issue.id] ?? issue.id.slice(0, 1).toUpperCase()}
						</span>
						<div>
							<CardTitle>{issue.name}</CardTitle>
							<CardDescription>{issue.description}</CardDescription>
						</div>
						<CardAction>
							<Badge variant="muted">{routeLabel(issue.route)}</Badge>
						</CardAction>
					</CardHeader>
					<CardContent>
						<ExternalAction href={issue.templateUrl} variant="outline" size="sm">
							Open {issue.id} form
						</ExternalAction>
					</CardContent>
				</Card>
			))}
		</div>

		<Alert variant="warning" className="tevm-security-alert">
			<AlertTitle>Security issue? Keep it private.</AlertTitle>
			<AlertDescription>
				Do not put exploit details, credentials, private RPC URLs, or embargoed findings in a public issue.{' '}
				<ExternalTextLink href={factoryData.repository.securityAdvisoryUrl}>Open a private advisory</ExternalTextLink>
			</AlertDescription>
		</Alert>
	</section>
)
