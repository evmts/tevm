#!/usr/bin/env node
// //:changesetCandidateCheck: validates pending changesets and internal
// dependency versions without git, so it runs in an Agent.Diff candidate
// tree. //:changesetCheck (`changeset status --since=origin/main`) remains
// the branch-level check where a repository is present.
import { glob, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readCandidate, validateCandidate } from './changeset-candidate-lib.mjs'
import { repositoryRoot } from './lib.mjs'

const workspace = await readFile(resolve(repositoryRoot, 'pnpm-workspace.yaml'), 'utf8')
const patterns = []
let inPackages = false
for (const line of workspace.split('\n')) {
	if (/^packages:\s*$/.test(line)) {
		inPackages = true
		continue
	}
	if (inPackages && /^\s+-\s+/.test(line)) {
		patterns.push(
			line
				.replace(/^\s+-\s+/, '')
				.trim()
				.replace(/^['"]|['"]$/g, ''),
		)
		continue
	}
	if (inPackages && /^\S/.test(line)) inPackages = false
}
const include = patterns.filter((pattern) => !pattern.startsWith('!'))
const exclude = patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1))
const directories = []
for await (const directory of glob(include, { cwd: repositoryRoot, exclude })) directories.push(directory)
directories.sort()
const candidate = await readCandidate(repositoryRoot, directories)
const findings = validateCandidate(candidate)
if (findings.length > 0) {
	console.error(`changeset candidate check failed:\n${findings.map((finding) => `- ${finding}`).join('\n')}`)
	process.exitCode = 1
} else {
	console.log(
		`changeset candidate ok: ${candidate.changesets.length} pending changeset(s), ${candidate.packages.length} packages`,
	)
}
