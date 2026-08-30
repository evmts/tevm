import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { factoryData } from './data'

describe('contributor portal', () => {
	it('renders issue, fork, factory, and approval affordances without an API token', () => {
		const html = renderToStaticMarkup(<App />)
		expect(html).toContain('Fork TEVM')
		expect(html).toContain('Open the right kind of issue')
		expect(html).toContain('Run the factory deliberately')
		expect(html).toContain(factoryData.approvalLabel)
		expect(html).not.toContain('GITHUB_TOKEN')
		for (const issue of factoryData.issueTypes) expect(html).toContain(issue.templateUrl.replaceAll('&', '&amp;'))
	})

	it('marks every external action as a new, non-opener browser context', () => {
		const html = renderToStaticMarkup(<App />)
		const externalAnchors = html.match(/<a[^>]+target="_blank"[^>]*>/g) ?? []
		expect(externalAnchors.length).toBeGreaterThan(factoryData.issueTypes.length)
		for (const anchor of externalAnchors) expect(anchor).toContain('rel="noreferrer noopener"')
	})
})
