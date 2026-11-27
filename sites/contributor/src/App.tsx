import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusPill } from '@smthrs/ui'
import { useState } from 'react'
import tevmLogo from '../../../docs/node/public/tevm-logo-dark.png'
import { ExternalAction, ExternalTextLink } from './components/ExternalAction'
import { factoryData, type ViewerRole } from './data'
import { ContributionPlan } from './sections/ContributionPlan'
import { FactoryDeck } from './sections/FactoryDeck'
import { Hero } from './sections/Hero'
import { IssueDesk } from './sections/IssueDesk'
import { LighthouseAudit } from './sections/LighthouseAudit'
import { McpAndTrust } from './sections/McpAndTrust'
import { WikiAndHistory } from './sections/WikiAndHistory'

const navigation = [
	{ href: '#overview', label: 'Overview', mark: '01' },
	{ href: '#audit', label: 'Lighthouse audit', mark: '02' },
	{ href: '#mcp', label: 'MCP & trust', mark: '03' },
	{ href: '#wiki', label: 'Wiki & history', mark: '04' },
	{ href: '#issues', label: 'Open an issue', mark: '05' },
	{ href: '#start', label: 'Fork & start', mark: '06' },
	{ href: '#factory', label: 'Factory targets', mark: '07' },
	{ href: '#recipes', label: 'Agent recipes', mark: '08' },
]

const ROLE_OPTIONS: Array<{ id: ViewerRole; label: string; hint: string }> = [
	{ id: 'viewer', label: 'Viewer', hint: 'Exploring TEVM and its public coding factory' },
	{ id: 'contributor', label: 'Contributor', hint: 'Contributed at least one issue, test, or Change' },
	{ id: 'maintainer', label: 'Maintainer', hint: 'Trusted merge, release, and sandbox control plane' },
]

const RoleBanner = ({ role }: { role: ViewerRole }) => {
	const { trust, cloud, repository } = factoryData
	if (role === 'maintainer') {
		return (
			<Card className="tevm-role-banner tevm-role-banner--maintainer" aria-label="Maintainer control plane">
				<CardHeader>
					<div>
						<CardTitle>Maintainer Control Plane ({trust.maintainers.join(', ')})</CardTitle>
						<CardDescription>
							Merges on Smithers Cloud mirror to GitHub <code>{repository.defaultBranch}</code> and automatically
							trigger Changesets releases, Vocs docs + <code>llms.txt</code> publishing, and wiki refreshes.
						</CardDescription>
					</div>
					<StatusPill status="ready" label="trusted write" />
				</CardHeader>
				<CardContent>
					<div className="tevm-wiki-links">
						<Badge variant="outline">{cloud.triggerCount} cloud triggers</Badge>
						<Badge variant="outline">{trust.protectedPaths.length} protected paths</Badge>
						<Badge variant="outline">cache: read + write</Badge>
						<Badge variant="outline">one-time sandbox auth active</Badge>
					</div>
				</CardContent>
			</Card>
		)
	}
	if (role === 'contributor') {
		return (
			<Card className="tevm-role-banner tevm-role-banner--contributor" aria-label="Contributor workbench">
				<CardHeader>
					<div>
						<CardTitle>Welcome back, Contributor</CardTitle>
						<CardDescription>
							Recognized contributors (1+ landed contribution) share the same open workspace as viewers plus fast BYOA
							MCP onboarding, local Uphill Lighthouse checks, and read-only shared cache hits on{' '}
							<code>{repository.objectStoreUrl}</code>.
						</CardDescription>
					</div>
					<StatusPill status="active" label="contributor (1+)" />
				</CardHeader>
				<CardContent>
					<div className="tevm-wiki-links">
						<Badge variant="outline">public TODOs open</Badge>
						<Badge variant="outline">untrusted runs encouraged</Badge>
						<Badge variant="outline">read-only shared cache</Badge>
					</div>
				</CardContent>
			</Card>
		)
	}
	return (
		<Card className="tevm-role-banner" aria-label="Public viewer overview">
			<CardHeader>
				<div>
					<CardTitle>Public TEVM Factory on Smithers Cloud</CardTitle>
					<CardDescription>
						Browse live Lighthouse backpressure gauges, the Obsidian wiki, mythical history, and public TODOs. Land your
						first issue or PR to unlock the Contributor view.
					</CardDescription>
				</div>
				<Badge variant="outline">public viewer</Badge>
			</CardHeader>
		</Card>
	)
}

const Sidebar = () => (
	<aside className="tevm-sidebar">
		<a className="tevm-wordmark" href="#overview" aria-label="TEVM contributor home">
			<img src={tevmLogo} alt="TEVM" />
			<span>factory</span>
		</a>
		<nav aria-label="Contributor portal">
			<p>Navigate</p>
			{navigation.map((item) => (
				<a href={item.href} key={item.href}>
					<span>{item.mark}</span>
					{item.label}
				</a>
			))}
		</nav>
		<div className="tevm-sidebar__foot">
			<Badge variant="outline">smithers cloud</Badge>
			<p>Build an EVM into any JavaScript environment.</p>
			<ExternalTextLink href={factoryData.repository.smithersUrl}>smithers.sh/evmts/tevm</ExternalTextLink>
			<ExternalTextLink href={factoryData.repository.webUrl}>github.com/evmts/tevm</ExternalTextLink>
		</div>
	</aside>
)

export const App = ({ initialRole = 'viewer' }: { initialRole?: ViewerRole }) => {
	const [role, setRole] = useState<ViewerRole>(initialRole)

	return (
		<div className="tevm-shell" data-audience={role}>
			<Sidebar />
			<div className="tevm-main">
				<header className="tevm-topbar">
					<div className="tevm-topbar__title">
						<span className="tevm-topbar__pulse" aria-hidden="true" />
						TEVM public coding factory
					</div>
					<div className="tevm-role-switcher" role="group" aria-label="Personalize view as">
						{ROLE_OPTIONS.map((option) => (
							<button
								key={option.id}
								type="button"
								title={option.hint}
								aria-pressed={role === option.id}
								className={`tevm-role-pill${role === option.id ? ' is-active' : ''}`}
								onClick={() => setRole(option.id)}
							>
								{option.label}
							</button>
						))}
					</div>
					<div className="tevm-topbar__actions">
						<ExternalAction href={factoryData.repository.smithersUrl} variant="ghost" size="sm">
							Open on Smithers
						</ExternalAction>
						<ExternalAction href={factoryData.repository.docsUrl} variant="outline" size="sm">
							Read docs
						</ExternalAction>
					</div>
				</header>

				<main>
					<RoleBanner role={role} />
					<Hero />
					<LighthouseAudit role={role} />
					<McpAndTrust role={role} />
					<WikiAndHistory />
					<IssueDesk />
					<ContributionPlan />
					<FactoryDeck />
				</main>

				<footer className="tevm-footer">
					<div>
						<strong>TEVM public coding factory</strong>
						<span>Policy, Lighthouse Uphill metrics, wiki, and mythical history generated from the repo contract.</span>
					</div>
					<div className="tevm-footer__links">
						<Button asChild variant="ghost" size="sm">
							<a href="#overview">Back to top ↑</a>
						</Button>
						<ExternalTextLink href={factoryData.repository.smithersUrl}>Smithers Cloud</ExternalTextLink>
						<ExternalTextLink href={factoryData.repository.webUrl}>GitHub</ExternalTextLink>
					</div>
				</footer>
			</div>
		</div>
	)
}
