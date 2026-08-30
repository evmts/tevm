import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseChangeset, validateCandidate } from './changeset-candidate-lib.mjs'

const packages = [
	{ name: '@tevm/actions', version: '1.0.0-rc.153', dependencies: { '@tevm/utils': 'workspace:*' } },
	{ name: '@tevm/utils', version: '1.0.0-rc.153', dependencies: {} },
	{ name: '@tevm/playground', version: '0.0.0', dependencies: { tevm: 'npm:tevm@1.0.0-rc.151' } },
	{ name: 'tevm', version: '1.0.0-rc.153', dependencies: { '@tevm/actions': '1.0.0-rc.153' } },
]

test('parses a changeset front matter with quoted and bare names', () => {
	const parsed = parseChangeset('---\n"@tevm/actions": patch\ntevm: minor\n---\n\nAdd a thing\n')
	assert.deepEqual(parsed, { bumps: { '@tevm/actions': 'patch', tevm: 'minor' }, summary: 'Add a thing' })
})

test('accepts an empty changeset that only carries a note', () => {
	assert.deepEqual(parseChangeset('---\n---\n\nRelease note only\n'), { bumps: {}, summary: 'Release note only' })
	assert.deepEqual(
		validateCandidate({
			changesets: [{ name: 'empty.md', text: '---\n---\n\nnote\n' }],
			packages: packages.slice(0, 2),
		}),
		[],
	)
})

test('accepts workspace and current-version internal dependencies and reports the alias', () => {
	const findings = validateCandidate({
		changesets: [{ name: 'good.md', text: '---\n"@tevm/actions": patch\n---\n\nA fix\n' }],
		packages,
	})
	assert.deepEqual(findings, [
		'@tevm/playground must depend on the current version of tevm: "1.0.0-rc.153" vs "npm:tevm@1.0.0-rc.151" (use workspace:*)',
	])
})

test('reports an unknown package, a bad bump, an empty summary, and missing front matter', () => {
	const findings = validateCandidate({
		changesets: [
			{ name: 'unknown.md', text: '---\n"@tevm/nope": patch\n---\n\nx\n' },
			{ name: 'bump.md', text: '---\n"@tevm/utils": huge\n---\n\nx\n' },
			{ name: 'summary.md', text: '---\n"@tevm/utils": patch\n---\n' },
			{ name: 'broken.md', text: 'no front matter' },
		],
		packages: packages.slice(0, 2),
	})
	assert.deepEqual(findings, [
		'unknown.md: @tevm/nope is not a workspace package',
		'bump.md: @tevm/utils bump "huge" is not patch, minor, or major',
		'summary.md: empty summary',
		'broken.md: missing front matter',
	])
})
