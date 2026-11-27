import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { emitDocsMarkdown, mdxToCleanMarkdown } from './emit-docs-markdown.mjs'
import { DOCS_ORIGIN } from './generate-llms-txt.mjs'

test('mdxToCleanMarkdown strips frontmatter and MDX imports while preserving heading', () => {
	const raw = `---\ntitle: Quickstart\ndescription: Run TEVM\n---\nimport { Callout } from 'vocs/components'\n\nInstall tevm.\n`
	const cleaned = mdxToCleanMarkdown(raw, 'Fallback')
	assert.equal(cleaned.startsWith('# Quickstart\n\nInstall tevm.'), true)
	assert.equal(cleaned.includes('import { Callout }'), false)
	assert.equal(cleaned.includes('---'), false)
})

test('emitDocsMarkdown writes every llms.txt route as a real .md file', async () => {
	const outDir = await mkdtemp(join(tmpdir(), 'tevm-docs-md-'))
	try {
		const result = await emitDocsMarkdown({ distDir: outDir })
		assert.ok(result.count > 40, `expected >40 emitted markdown files, got ${result.count}`)
		const llms = await readFile(join(outDir, 'llms.txt'), 'utf8')
		const links = [...llms.matchAll(/\]\((https:\/\/node\.tevm\.sh\/[^)]+)\)/g)].map((m) => m[1])
		assert.ok(links.length > 40, 'llms.txt should contain >40 same-origin .md links')
		for (const url of links) {
			const rel = url.slice(`${DOCS_ORIGIN}/`.length)
			assert.ok(rel.endsWith('.md'), `expected .md route, got ${url}`)
			assert.equal(existsSync(join(outDir, rel)), true, `missing emitted markdown file for ${url}`)
		}
		assert.equal(existsSync(join(outDir, 'wiki/start-here.md')), true)
		assert.equal(existsSync(join(outDir, 'wiki/mythical-history.md')), true)
	} finally {
		await rm(outDir, { recursive: true, force: true })
	}
})

test('emitDocsMarkdown also populates dist/public for Vocs v2 / Waku static builds', async () => {
	const outDir = await mkdtemp(join(tmpdir(), 'tevm-docs-v2-'))
	const publicDir = join(outDir, 'public')
	await mkdir(publicDir, { recursive: true })
	try {
		const result = await emitDocsMarkdown({ distDir: outDir })
		assert.equal(result.targetDirs.length, 2)
		assert.equal(existsSync(join(publicDir, 'llms.txt')), true)
		assert.equal(existsSync(join(publicDir, 'getting-started/overview.md')), true)
		assert.equal(existsSync(join(publicDir, 'wiki/start-here.md')), true)
		assert.equal(existsSync(join(publicDir, 'wiki/mythical-history.md')), true)
		const llms = await readFile(join(publicDir, 'llms.txt'), 'utf8')
		assert.match(llms, /Public Coding Factory/)
	} finally {
		await rm(outDir, { recursive: true, force: true })
	}
})
