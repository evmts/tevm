import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { emitDocsMarkdown, mdxToCleanMarkdown } from './emit-docs-markdown.mjs'
import { DOCS_ORIGIN } from './generate-llms-txt.mjs'

test('mdxToCleanMarkdown strips top-level MDX imports while preserving imports inside code fences', () => {
	const raw = [
		'---',
		'title: Quickstart',
		'description: Run TEVM',
		'---',
		"import { Callout } from 'vocs/components'",
		'',
		'Install tevm:',
		'',
		'```ts',
		"import { createMemoryClient } from 'tevm'",
		'const client = createMemoryClient()',
		'```',
		'',
	].join('\n')
	const cleaned = mdxToCleanMarkdown(raw, 'Fallback')
	assert.equal(cleaned.startsWith('# Quickstart\n\nInstall tevm:'), true)
	assert.equal(cleaned.includes('import { Callout }'), false)
	assert.equal(cleaned.includes("import { createMemoryClient } from 'tevm'"), true)
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

test('emitDocsMarkdown also populates dist/public and .vercel/output/static when present', async () => {
	const workDir = await mkdtemp(join(tmpdir(), 'tevm-docs-v2-'))
	const outDir = join(workDir, 'dist')
	const publicDir = join(outDir, 'public')
	const vercelStaticDir = join(workDir, '.vercel/output/static')
	await mkdir(publicDir, { recursive: true })
	await mkdir(vercelStaticDir, { recursive: true })
	try {
		const result = await emitDocsMarkdown({ distDir: outDir })
		assert.equal(result.targetDirs.length, 3)
		for (const dir of [outDir, publicDir, vercelStaticDir]) {
			assert.equal(existsSync(join(dir, 'llms.txt')), true)
			assert.equal(existsSync(join(dir, 'getting-started/overview.md')), true)
			assert.equal(existsSync(join(dir, 'wiki/start-here.md')), true)
			assert.equal(existsSync(join(dir, 'wiki/mythical-history.md')), true)
		}
		const llms = await readFile(join(vercelStaticDir, 'llms.txt'), 'utf8')
		assert.match(llms, /Public Coding Factory/)
	} finally {
		await rm(workDir, { recursive: true, force: true })
	}
})
