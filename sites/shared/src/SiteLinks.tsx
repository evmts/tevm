import type { CSSProperties } from 'react'
import { type DocsSiteId, docsSites } from './config'

type SiteLinksProps = {
	current: DocsSiteId
}

export const SiteLinks = ({ current }: SiteLinksProps) => (
	<nav className="constellation" aria-label="tevm documentation sites">
		<p className="constellation__eyebrow">Documentation constellation</p>
		<h2>Find the right surface</h2>
		<div className="constellation__grid">
			{docsSites.map((site) => (
				<a
					className="constellation__card"
					href={site.url}
					key={site.id}
					aria-current={site.id === current ? 'page' : undefined}
					style={{ '--site-order': docsSites.indexOf(site) } as CSSProperties}
				>
					<span className="constellation__title">
						{site.name}
						{site.id === current ? <small>you are here</small> : null}
					</span>
					<span className="constellation__description">{site.description}</span>
					<span className="constellation__status">{site.status === 'live' ? 'Open docs' : 'Planned site'}</span>
				</a>
			))}
		</div>
	</nav>
)
