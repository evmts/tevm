#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assert, command, parseArgs, readPolicy, repositoryRoot } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const apply = args.has('apply')
const source = await readFile(resolve(repositoryRoot, '.github/labels.yml'), 'utf8')
const policy = await readPolicy()

const fieldValue = (block, field) => {
	const match = block.match(new RegExp(`^  ${field}: (.+)$`, 'm'))
	assert(match, `label entry is missing ${field}`)
	const value = match[1].trim()
	return value.startsWith('"') ? JSON.parse(value) : value
}

const labels = source
	.split(/(?=^- name: )/m)
	.filter((block) => block.startsWith('- name: '))
	.map((block) => ({
		name: block.match(/^- name: (.+)$/m)?.[1].trim(),
		color: fieldValue(block, 'color'),
		description: fieldValue(block, 'description'),
	}))

assert(labels.length > 0, 'no labels found in .github/labels.yml')
assert(new Set(labels.map((label) => label.name)).size === labels.length, 'label names must be unique')
for (const label of labels) {
	assert(typeof label.name === 'string' && /^[a-z][a-z0-9:-]+$/.test(label.name), `invalid label name ${label.name}`)
	assert(/^[0-9A-F]{6}$/.test(label.color), `invalid color for ${label.name}`)
	assert(label.description.length <= 100, `description for ${label.name} exceeds GitHub's limit`)
}

if (apply) {
	assert(process.env.GH_TOKEN, 'GH_TOKEN is required with --apply')
	const repository = `${policy.repository.owner}/${policy.repository.name}`
	for (const label of labels) {
		command(
			'gh',
			[
				'label',
				'create',
				label.name,
				'--repo',
				repository,
				'--color',
				label.color,
				'--description',
				label.description,
				'--force',
			],
			{ stdio: 'inherit' },
		)
	}
}

console.log(`factory labels ${apply ? 'synced' : 'validated'}: ${labels.length}`)
