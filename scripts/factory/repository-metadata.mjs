#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const write = process.argv.includes('--write')
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })
const canonicalRepository = 'https://github.com/evmts/tevm'
const legacyRepository = /github\.com\/evmts\/tevm-monorepo(?=\.git(?:$|[#?])|(?:$|[#?]))/g
const manifests = git('ls-files', '-z', '--cached', '--others', '--exclude-standard', '*package.json')
	.split('\0')
	.filter(Boolean)
const findings = []
const changed = []

const normalizeUrl = (url) =>
	url
		.replace(/^git\+/, '')
		.replace(/\.git$/, '')
		.replace(/\/$/, '')

for (const path of manifests) {
	let manifest
	try {
		manifest = JSON.parse(readFileSync(path, 'utf8'))
	} catch (error) {
		findings.push(`${path}: invalid JSON (${error instanceof Error ? error.message : String(error)})`)
		continue
	}
	if (manifest.repository === undefined) continue

	let dirty = false
	if (typeof manifest.repository === 'string') {
		const next = manifest.repository.replace(legacyRepository, 'github.com/evmts/tevm')
		if (next !== manifest.repository) {
			manifest.repository = next
			dirty = true
		}
		if (normalizeUrl(manifest.repository) !== canonicalRepository) {
			findings.push(`${path}: repository URL is not ${canonicalRepository}`)
		}
	} else if (manifest.repository !== null && typeof manifest.repository === 'object') {
		if (typeof manifest.repository.url !== 'string') {
			findings.push(`${path}: repository.url must be a string`)
			continue
		}
		const next = manifest.repository.url.replace(legacyRepository, 'github.com/evmts/tevm')
		if (next !== manifest.repository.url) {
			manifest.repository.url = next
			dirty = true
		}
		if (normalizeUrl(manifest.repository.url) !== canonicalRepository) {
			findings.push(`${path}: repository.url is not ${canonicalRepository}`)
		}
	} else {
		findings.push(`${path}: repository must be a URL string or object`)
	}

	if (dirty && write) {
		writeFileSync(path, `${JSON.stringify(manifest, null, '\t')}\n`)
		changed.push(path)
	} else if (dirty) {
		findings.push(`${path}: legacy evmts/tevm-monorepo repository URL`)
	}
}

const workflowFiles = git('ls-files', '-z', '.github/workflows/*.yml', '.github/workflows/*.yaml')
	.split('\0')
	.filter(Boolean)
for (const path of workflowFiles) {
	const current = readFileSync(path, 'utf8')
	const next = current.replaceAll('evmts/tevm-monorepo', 'evmts/tevm')
	if (current === next) continue
	if (write) {
		writeFileSync(path, next)
		changed.push(path)
	} else {
		findings.push(`${path}: legacy evmts/tevm-monorepo repository identity`)
	}
}

if (findings.length > 0) {
	console.error(`repository metadata failed:\n${findings.map((finding) => `- ${finding}`).join('\n')}`)
	console.error('Run pnpm factory:metadata-write for mechanical fixes.')
	process.exitCode = 1
} else {
	console.log(
		write
			? `repository metadata synchronized: ${changed.length} file(s)`
			: `repository metadata ok: ${manifests.length} manifests, ${workflowFiles.length} workflows`,
	)
}
