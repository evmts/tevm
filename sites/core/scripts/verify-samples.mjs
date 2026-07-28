import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pagesDir = join(siteDir, 'pages')
const packageDir = realpathSync(join(siteDir, 'node_modules', 'tevm'))
const packageJson = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))

assert.equal(packageJson.version, '1.0.0-rc.151', `Expected published tevm@1.0.0-rc.151, found ${packageJson.version}`)
assert.notEqual(packageDir, resolve(siteDir, '..', '..', 'tevm'), 'Sample runner resolved the workspace package')

const collectPages = (directory) =>
	readdirSync(directory)
		.flatMap((name) => {
			const entry = join(directory, name)
			return statSync(entry).isDirectory() ? collectPages(entry) : [entry]
		})
		.filter((entry) => entry.endsWith('.mdx'))

// Executed languages run in Node against the published package. Illustrative
// languages are allowed in pages but never executed. Anything else is a typo.
const executedLanguages = new Set(['ts', 'typescript'])
const illustrativeLanguages = new Set(['bash', 'sh', 'shell', 'json', 'jsonc', 'solidity', 'text', 'diff', 'toml'])

const samples = []
let skipped = 0
const fencePattern = /^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm

for (const page of collectPages(pagesDir)) {
	const source = readFileSync(page, 'utf8')
	for (const match of source.matchAll(fencePattern)) {
		// Vocs allows meta after the language, e.g. ```ts twoslash [file.ts]
		const language = match[1].trim().split(/\s+/)[0]
		if (illustrativeLanguages.has(language)) {
			skipped += 1
			continue
		}
		assert.ok(
			executedLanguages.has(language),
			`${relative(siteDir, page)} has a fence with unknown language "${language}". Add it to executedLanguages or illustrativeLanguages.`,
		)
		samples.push({
			page: relative(siteDir, page),
			code: match[2],
		})
	}
}

assert.ok(samples.length >= 10, `Expected at least 10 documentation samples, found ${samples.length}`)

for (const [index, sample] of samples.entries()) {
	const result = spawnSync(process.execPath, ['--input-type=module', '--eval', sample.code], {
		cwd: siteDir,
		encoding: 'utf8',
		timeout: 90_000,
		env: {
			...process.env,
			NODE_NO_WARNINGS: '1',
		},
	})

	if (result.status !== 0) {
		process.stderr.write(`Sample ${index + 1} failed in ${sample.page}\n`)
		process.stderr.write(result.stdout)
		process.stderr.write(result.stderr)
		process.exit(result.status ?? 1)
	}
}

console.log(
	`Executed ${samples.length} samples against tevm@${packageJson.version} from ${packageDir} (${skipped} illustrative fences not executed)`,
)
