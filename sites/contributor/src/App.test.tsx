import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { factoryData } from './data'

describe('contributor portal', () => {
	it('renders issue, fork, factory, lighthouse audit, MCP, wiki, and approval affordances without an API token', () => {
		const html = renderToStaticMarkup(<App />)
		expect(html).toContain('Fork TEVM')
		expect(html).toContain('Open the right kind of issue')
		expect(html).toContain('Run the factory deliberately')
		expect(html).toContain('Lighthouse quality and trust gauges')
		expect(html).toContain('Attach your agent, share the cache safely')
		expect(html).toContain('Obsidian wiki and mythical history')
		expect(html).toContain(factoryData.repository.mcpUrl)
		expect(html).toContain(factoryData.approvalLabel)
		expect(html).not.toContain('GITHUB_TOKEN')
		for (const issue of factoryData.issueTypes) expect(html).toContain(issue.templateUrl.replaceAll('&', '&amp;'))
		for (const cat of factoryData.lighthouse.categories) expect(html).toContain(cat.title.replaceAll('&', '&amp;'))
	})

	it('personalizes views cleanly across viewer, contributor, and maintainer roles', () => {
		const viewerHtml = renderToStaticMarkup(<App initialRole="viewer" />)
		expect(viewerHtml).toContain('data-audience="viewer"')
		expect(viewerHtml).toContain('Public TEVM Factory on Smithers Cloud')
		expect(viewerHtml).toContain('Open Workbench')
		expect(viewerHtml).toContain('Public TODOs')
		expect(viewerHtml).not.toContain('Maintainer Control Plane')

		const contributorHtml = renderToStaticMarkup(<App initialRole="contributor" />)
		expect(contributorHtml).toContain('data-audience="contributor"')
		expect(contributorHtml).toContain('Welcome back, Contributor')
		expect(contributorHtml).toContain('Attach MCP')
		expect(contributorHtml).toContain('uphill check')

		const maintainerHtml = renderToStaticMarkup(<App initialRole="maintainer" />)
		expect(maintainerHtml).toContain('data-audience="maintainer"')
		expect(maintainerHtml).toContain('Maintainer Control Plane')
		expect(maintainerHtml).toContain('Cloud Flows')
		expect(maintainerHtml).toContain('Review Changes')
		expect(maintainerHtml).toContain('One-Time Sandbox Auth')
	})

	it('marks every external action as a new, non-opener browser context', () => {
		const html = renderToStaticMarkup(<App />)
		const externalAnchors = html.match(/<a[^>]+target="_blank"[^>]*>/g) ?? []
		expect(externalAnchors.length).toBeGreaterThan(factoryData.issueTypes.length)
		for (const anchor of externalAnchors) expect(anchor).toContain('rel="noreferrer noopener"')
	})
})
