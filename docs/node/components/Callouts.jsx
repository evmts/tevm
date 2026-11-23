import React from 'react'

/**
 * Head First–inspired visual callouts and comparison cards.
 * Kept crisp, understated, and legible in both light and dark themes.
 */

export function UnderTheHood({ title = 'Under the hood', children }) {
	return (
		<aside className="tevm-callout tevm-callout--hood">
			<div className="tevm-callout__label">{title}</div>
			<div className="tevm-callout__body">{children}</div>
		</aside>
	)
}

export function WatchOut({ title = 'Watch out', children }) {
	return (
		<aside className="tevm-callout tevm-callout--warn">
			<div className="tevm-callout__label">{title}</div>
			<div className="tevm-callout__body">{children}</div>
		</aside>
	)
}

export function QaBox({ question, children }) {
	return (
		<aside className="tevm-callout tevm-callout--qa">
			<div className="tevm-callout__label">Q: {question}</div>
			<div className="tevm-callout__body">{children}</div>
		</aside>
	)
}

export function CompareGrid({ children }) {
	return <div className="tevm-compare-grid">{children}</div>
}

export function CompareCard({ title, badge, children }) {
	return (
		<div className="tevm-compare-card">
			<div className="tevm-compare-card__head">
				<span className="tevm-compare-card__title">{title}</span>
				{badge && <span className="tevm-compare-card__badge">{badge}</span>}
			</div>
			<div className="tevm-compare-card__body">{children}</div>
		</div>
	)
}
