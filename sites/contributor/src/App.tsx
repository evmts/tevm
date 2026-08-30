import { Badge, Button } from '@smthrs/ui'
import tevmLogo from '../../../docs/node/public/tevm-logo-dark.png'
import { ExternalAction, ExternalTextLink } from './components/ExternalAction'
import { factoryData } from './data'
import { ContributionPlan } from './sections/ContributionPlan'
import { FactoryDeck } from './sections/FactoryDeck'
import { Hero } from './sections/Hero'
import { IssueDesk } from './sections/IssueDesk'

const navigation = [
	{ href: '#overview', label: 'Overview', mark: '01' },
	{ href: '#issues', label: 'Open an issue', mark: '02' },
	{ href: '#start', label: 'Fork & start', mark: '03' },
	{ href: '#factory', label: 'Factory targets', mark: '04' },
	{ href: '#recipes', label: 'Agent recipes', mark: '05' },
]

const Sidebar = () => (
	<aside className="tevm-sidebar">
		<a className="tevm-wordmark" href="#overview" aria-label="TEVM contributor home">
			<img src={tevmLogo} alt="TEVM" />
			<span>contributor</span>
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
			<Badge variant="outline">open source</Badge>
			<p>Build an EVM into any JavaScript environment.</p>
			<ExternalTextLink href={factoryData.repository.webUrl}>evmts/tevm</ExternalTextLink>
		</div>
	</aside>
)

export const App = () => (
	<div className="tevm-shell">
		<Sidebar />
		<div className="tevm-main">
			<header className="tevm-topbar">
				<div className="tevm-topbar__title">
					<span className="tevm-topbar__pulse" aria-hidden="true" />
					TEVM contributor factory
				</div>
				<div className="tevm-topbar__actions">
					<ExternalAction href={factoryData.repository.docsUrl} variant="ghost" size="sm">
						Read docs
					</ExternalAction>
					<ExternalAction href={factoryData.repository.discussionsUrl} variant="outline" size="sm">
						Ask the community
					</ExternalAction>
				</div>
			</header>

			<main>
				<Hero />
				<IssueDesk />
				<ContributionPlan />
				<FactoryDeck />
			</main>

			<footer className="tevm-footer">
				<div>
					<strong>TEVM contributor factory</strong>
					<span>Policy and UI facts generated from the repository contract.</span>
				</div>
				<div className="tevm-footer__links">
					<Button asChild variant="ghost" size="sm">
						<a href="#overview">Back to top ↑</a>
					</Button>
					<ExternalTextLink href={factoryData.repository.webUrl}>GitHub</ExternalTextLink>
				</div>
			</footer>
		</div>
	</div>
)
