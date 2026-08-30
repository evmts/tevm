#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })
const listed = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean)
const findings = []

for (const path of listed) {
	let contents
	try {
		contents = readFileSync(path)
	} catch {
		continue
	}
	if (contents.includes(0)) continue
	const text = contents.toString('utf8')
	const hasStart = /^<<<<<<< .+$/m.test(text)
	const hasMiddle = /^=======$/m.test(text)
	const hasEnd = /^>>>>>>> .+$/m.test(text)
	if (hasStart || hasEnd || (hasMiddle && (hasStart || hasEnd))) {
		findings.push(`${path}: unresolved merge-conflict marker`)
	}
}

const gitlinks = git('ls-files', '-s', '-z')
	.split('\0')
	.filter(Boolean)
	.flatMap((entry) => {
		const match = /^(\d+) [0-9a-f]+ \d+\t(.+)$/.exec(entry)
		return match?.[1] === '160000' ? [match[2]] : []
	})

let declaredGitlinks = []
try {
	declaredGitlinks = git('config', '-z', '-f', '.gitmodules', '--get-regexp', '^submodule..*.path$')
		.split('\0')
		.filter(Boolean)
		.flatMap((entry) => {
			const separator = entry.indexOf('\n')
			return separator === -1 ? [] : [entry.slice(separator + 1)]
		})
} catch {
	// No .gitmodules file is a valid state when there are no gitlinks.
}

for (const path of gitlinks) {
	if (!declaredGitlinks.includes(path)) findings.push(`${path}: orphaned gitlink is not declared in .gitmodules`)
}

if (findings.length > 0) {
	console.error(`source integrity failed:\n${findings.map((finding) => `- ${finding}`).join('\n')}`)
	process.exitCode = 1
} else {
	console.log(`source integrity ok: ${listed.length} files, ${gitlinks.length} declared gitlinks`)
}
