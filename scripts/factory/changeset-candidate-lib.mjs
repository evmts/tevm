// Git-free changeset validation for an Agent.Diff candidate tree.
//
// `changeset status` diffs against a git base, and a candidate tree carries
// no repository, so the lane gate validates what a changeset must satisfy
// from the files alone: every pending changeset names workspace packages
// with a valid bump and a summary, and every workspace package depends on
// another through the workspace protocol or its current version, which is
// the rule `changeset status` enforces at release time.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const bumps = new Set(['patch', 'minor', 'major'])

/**
 * Parses one changeset file into its package bumps and summary.
 * @param {string} text
 * @returns {{ bumps: Record<string, string>, summary: string, error?: string }}
 */
export const parseChangeset = (text) => {
	// An empty front matter (`changeset --empty`) is valid: the file only carries a note.
	const match = /^---\r?\n([\s\S]*?)---\r?\n?([\s\S]*)$/.exec(text)
	if (!match) return { bumps: {}, summary: '', error: 'missing front matter' }
	const bumpsFound = {}
	for (const line of match[1].split(/\r?\n/)) {
		if (line.trim() === '') continue
		const entry = /^\s*(?:"([^"]+)"|'([^']+)'|([^\s:]+))\s*:\s*(\S+)\s*$/.exec(line)
		if (!entry) return { bumps: {}, summary: '', error: `unreadable front matter line: ${line.trim()}` }
		bumpsFound[entry[1] ?? entry[2] ?? entry[3]] = entry[4]
	}
	return { bumps: bumpsFound, summary: match[2].trim() }
}

/**
 * Validates pending changesets and internal dependency versions.
 * @param {{ changesets: Array<{ name: string, text: string }>, packages: Array<{ name: string, version: string, dependencies: Record<string, string> }> }} input
 * @returns {string[]} findings, empty when the candidate is valid
 */
export const validateCandidate = ({ changesets, packages }) => {
	const findings = []
	const versions = new Map(packages.map((pkg) => [pkg.name, pkg.version]))
	for (const changeset of changesets) {
		const parsed = parseChangeset(changeset.text)
		if (parsed.error) {
			findings.push(`${changeset.name}: ${parsed.error}`)
			continue
		}
		for (const [name, bump] of Object.entries(parsed.bumps)) {
			if (!versions.has(name)) findings.push(`${changeset.name}: ${name} is not a workspace package`)
			if (!bumps.has(bump)) findings.push(`${changeset.name}: ${name} bump "${bump}" is not patch, minor, or major`)
		}
		if (parsed.summary === '') findings.push(`${changeset.name}: empty summary`)
	}
	for (const pkg of packages) {
		for (const [dependency, range] of Object.entries(pkg.dependencies)) {
			const current = versions.get(dependency)
			if (current === undefined) continue
			if (range.startsWith('workspace:') || range === current || range === `^${current}` || range === `~${current}`) {
				continue
			}
			findings.push(
				`${pkg.name} must depend on the current version of ${dependency}: "${current}" vs "${range}" (use workspace:*)`,
			)
		}
	}
	return findings
}

/**
 * Reads every changeset and workspace package below a repository root.
 * @param {string} root
 * @param {string[]} packageDirectories workspace-relative package directories
 */
export const readCandidate = async (root, packageDirectories) => {
	const changesetDirectory = join(root, '.changeset')
	const changesets = []
	for (const entry of (await readdir(changesetDirectory)).sort()) {
		if (!entry.endsWith('.md') || entry === 'README.md') continue
		changesets.push({ name: entry, text: await readFile(join(changesetDirectory, entry), 'utf8') })
	}
	const packages = []
	for (const directory of packageDirectories) {
		let manifest
		try {
			manifest = JSON.parse(await readFile(join(root, directory, 'package.json'), 'utf8'))
		} catch {
			continue
		}
		if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string') continue
		packages.push({
			name: manifest.name,
			version: manifest.version,
			dependencies: {
				...manifest.dependencies,
				...manifest.devDependencies,
				...manifest.peerDependencies,
				...manifest.optionalDependencies,
			},
		})
	}
	return { changesets, packages }
}
