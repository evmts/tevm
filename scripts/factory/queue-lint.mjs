#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readJson, repositoryRoot } from './lib.mjs'

const queueDirectory = resolve(repositoryRoot, 'factory/queue/issues')
const schema = await readJson(resolve(repositoryRoot, 'factory/schemas/issue-plan.schema.json'))
let entries = []
try {
	entries = await readdir(queueDirectory, { withFileTypes: true })
} catch (error) {
	if (error?.code !== 'ENOENT') throw error
}

const requiredFrontmatter = ['schemaVersion', 'issue', 'url', 'type', 'route', 'risk', 'bodyDigest', 'status']
const requiredHeadings = ['Problem', 'Acceptance criteria', 'Likely owners', 'Test plan', 'Risks and approvals']
const failures = []

for (const entry of entries) {
	if (!entry.isFile() || !entry.name.endsWith('.md')) continue
	if (!/^issue-[1-9][0-9]*\.md$/.test(entry.name)) {
		failures.push(`${entry.name}: expected issue-<number>.md`)
		continue
	}
	const text = await readFile(resolve(queueDirectory, entry.name), 'utf8')
	const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1]
	if (!frontmatter) {
		failures.push(`${entry.name}: missing YAML frontmatter`)
		continue
	}
	for (const field of requiredFrontmatter) {
		if (!new RegExp(`^${field}:\\s*\\S+`, 'm').test(frontmatter)) failures.push(`${entry.name}: missing ${field}`)
	}
	const fileIssue = entry.name.match(/[0-9]+/)?.[0]
	const declaredIssue = /^issue:\s*([0-9]+)\s*$/m.exec(frontmatter)?.[1]
	if (declaredIssue && declaredIssue !== fileIssue) failures.push(`${entry.name}: issue field does not match filename`)
	const field = (name) => new RegExp(`^${name}:\\s*(\\S+)\\s*$`, 'm').exec(frontmatter)?.[1]
	if (field('schemaVersion') !== '1') failures.push(`${entry.name}: schemaVersion must be 1`)
	if (field('url') !== `https://github.com/evmts/tevm/issues/${fileIssue}`)
		failures.push(`${entry.name}: url must be the canonical issue URL`)
	for (const name of ['type', 'route', 'risk']) {
		if (!schema.properties[name].enum.includes(field(name))) failures.push(`${entry.name}: invalid ${name}`)
	}
	if (field('status') !== schema.properties.status.const) failures.push(`${entry.name}: status must be planned`)
	if (!/^bodyDigest:\s*[0-9a-f]{64}\s*$/m.test(frontmatter)) failures.push(`${entry.name}: invalid bodyDigest`)
	for (const heading of requiredHeadings) {
		if (!new RegExp(`^## ${heading}$`, 'm').test(text)) failures.push(`${entry.name}: missing ## ${heading}`)
	}
}

if (failures.length > 0) {
	console.error(failures.join('\n'))
	process.exitCode = 1
} else {
	console.log(
		`factory queue ok: ${entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).length} plan(s)`,
	)
}
