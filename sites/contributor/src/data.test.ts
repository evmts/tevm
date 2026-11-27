import { describe, expect, it } from 'vitest'
import { entriesForGroup, externalLinkProps, factoryData, safeExternalUrl, targetCommand } from './data'

describe('contributor data contract', () => {
	it('keeps every generated action on an approved HTTPS host', () => {
		const links = [
			...Object.entries(factoryData.repository)
				.filter(([key]) => key.endsWith('Url'))
				.map(([, value]) => value),
			...factoryData.issueTypes.map((issue) => issue.templateUrl),
			...factoryData.wiki.map((page) => page.url),
		]
		for (const link of links) expect(safeExternalUrl(link)).toBe(link)
	})

	it('carries Lighthouse audit categories, wiki pages, mythical history, and strict trust invariants', () => {
		expect(factoryData.lighthouse.categories.length).toBe(4)
		expect(factoryData.wiki.length).toBeGreaterThanOrEqual(8)
		expect(factoryData.mythicalHistory.length).toBeGreaterThanOrEqual(6)
		expect(factoryData.trust.allowUntrustedExecution).toBe(true)
		expect(factoryData.trust.untrustedCacheWrite).toBe(false)
		expect(factoryData.trust.untrustedSkipGates).toBe(false)
	})

	it.each([
		'javascript:alert(1)',
		'http://github.com/evmts/tevm',
		'https://github.com.evil.test/evmts/tevm',
		'https://token@github.com/evmts/tevm',
		'https://github.com:444/evmts/tevm',
	])('rejects unsafe external action %s', (link) => {
		expect(() => safeExternalUrl(link)).toThrow(TypeError)
	})

	it('adds defensive browser attributes to external links', () => {
		expect(externalLinkProps(factoryData.repository.webUrl)).toEqual({
			href: 'https://github.com/evmts/tevm',
			target: '_blank',
			rel: 'noreferrer noopener',
		})
	})

	it('gives every Smithers group a runnable target command', () => {
		for (const group of factoryData.plugin.groups) {
			const entries = entriesForGroup(group.id)
			expect(entries.length).toBeGreaterThan(0)
			for (const entry of entries) {
				expect(targetCommand(entry)).toBe(`pnpm exec smthrs target ${entry.label}`)
				expect(entry.workspace).toBe('.')
			}
		}
	})

	it('exposes a guided command for every parameterized workflow', () => {
		for (const workflow of factoryData.guidedWorkflows) {
			expect(workflow.label).toMatch(/^\/\/workflows\/.+:.+$/)
			expect(workflow.command).toMatch(/^pnpm /)
		}
	})
})
