import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { normalizeIssue } from './issue-intake-lib.mjs'
import { repositoryRoot } from './lib.mjs'

const policy = JSON.parse(await readFile(resolve(repositoryRoot, 'factory/policy.json'), 'utf8'))

const issue = (overrides = {}) => ({
	number: 123,
	state: 'OPEN',
	title: 'Fix state cache invalidation after a fork',
	url: 'https://github.com/evmts/tevm/issues/123',
	author: { login: 'contributor' },
	labels: [{ name: 'type:bug' }, { name: 'factory:ready' }],
	body: [
		'### Summary',
		'State cache entries survive a fork reset.',
		'### Acceptance criteria',
		'- A regression test passes.',
		'### Reproduction',
		'Run the included fixture.',
		'### Expected behavior',
		'The stale entry is discarded.',
	].join('\n\n'),
	...overrides,
})

test('routes a complete approved bug to implementation', () => {
	const result = normalizeIssue(issue(), policy, 'evmts/tevm')
	assert.equal(result.ready, true)
	assert.equal(result.route, 'issue-to-pr')
	assert.equal(result.status, 'ready')
	assert.deepEqual(result.missingHeadings, [])
})

test('holds high-risk issue text even with the approval label', () => {
	const result = normalizeIssue(issue({ body: `${issue().body}\n\nPaste a private key here.` }), policy, 'evmts/tevm')
	assert.equal(result.ready, false)
	assert.equal(result.risk, 'high')
	assert.equal(result.status, 'held')
})

test('reports missing contract sections without copying the issue body', () => {
	const result = normalizeIssue(issue({ body: '### Summary\nToo little detail.' }), policy, 'evmts/tevm')
	assert.equal(result.status, 'needs-info')
	assert.deepEqual(result.missingHeadings, ['Acceptance criteria', 'Reproduction', 'Expected behavior'])
	assert.equal('body' in result, false)
})

test('prefers a contributor-facing GitHub URL over the REST endpoint', () => {
	const result = normalizeIssue(
		issue({
			url: 'https://api.github.com/repos/evmts/tevm/issues/123',
			html_url: 'https://github.com/evmts/tevm/issues/123',
		}),
		policy,
		'evmts/tevm',
	)
	assert.equal(result.issue.url, 'https://github.com/evmts/tevm/issues/123')
})
