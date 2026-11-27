#!/usr/bin/env node
/**
 * Emits clean Markdown (.md) mirrors of every docs/node/pages page, every
 * .smithers/wiki page, and .smithers/history/MYTHICAL.md into docs/node/dist/
 * alongside the deterministic llms.txt index.
 *
 * Ensures every link in https://node.tevm.sh/llms.txt resolves to HTTP 200
 * Markdown so Smithers Cloud's in-app Docs tab and `/docs evmts/tevm` search
 * render every TEVM page natively.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractDocTitle, listDocFiles, pageMarkdownRoute, renderLlmsTxt } from './generate-llms-txt.mjs'
import { readJson, repositoryRoot } from './lib.mjs'

/**
 * Strips YAML frontmatter and top-level MDX-only import statements (never inside
 * fenced code blocks) while keeping readable Markdown with a guaranteed top-level heading.
 * @param {string} raw
 * @param {string} fallbackTitle
 */
export function mdxToCleanMarkdown(raw, fallbackTitle) {
	const title = extractDocTitle(raw, fallbackTitle)
	let body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
	// Drop top-level ESM import lines used by Vocs JSX components without touching code fences
	let inFence = false
	const kept = []
	for (const line of body.split(/\r?\n/)) {
		if (/^\s*```/.test(line)) {
			inFence = !inFence
			kept.push(line)
			continue
		}
		if (!inFence && /^import\s+/.test(line)) {
			continue
		}
		kept.push(line)
	}
	body = kept.join('\n').trimStart()
	if (!/^#\s+/m.test(body)) {
		body = `# ${title}\n\n${body}`
	}
	return `${body.trimEnd()}\n`
}

/**
 * Writes clean .md mirrors + llms.txt into `distDir` and any active static output
 * directories created by Vocs v2 / Waku (`<distDir>/public`) or Vercel Build Output API v3
 * (`<docsDir>/.vercel/output/static` and `<root>/.vercel/output/static`).
 * @param {{ root?: string, distDir?: string }} [options]
 */
export async function emitDocsMarkdown({ root = repositoryRoot, distDir = resolve(root, 'docs/node/dist') } = {}) {
	const pagesDir = resolve(root, 'docs/node/pages')
	const files = await listDocFiles(pagesDir)
	const candidates = [
		distDir,
		resolve(distDir, 'public'),
		resolve(dirname(distDir), '.vercel/output/static'),
		resolve(root, '.vercel/output/static'),
	]
	const targetDirs = [...new Set(candidates.filter((dir, index) => index === 0 || existsSync(dir)))]
	const written = []

	/** @param {string} route @param {string} content */
	async function writeToTargets(route, content) {
		const rel = route.replace(/^\//, '')
		for (const dir of targetDirs) {
			const target = resolve(dir, rel)
			await mkdir(dirname(target), { recursive: true })
			await writeFile(target, content)
		}
		written.push(route)
	}

	for (const file of files) {
		const route = pageMarkdownRoute(pagesDir, file)
		const raw = await readFile(file, 'utf8')
		const fallback = route === '/index.md' ? 'TEVM Node' : (route.replace(/\.md$/, '').split('/').at(-1) ?? 'Guide')
		await writeToTargets(route, mdxToCleanMarkdown(raw, fallback))
	}

	// Mirror Obsidian Engineering Wiki pages and Mythical History into /wiki/*.md
	const wikiCatalog = await readJson(resolve(root, '.smithers/coding-project.json'))
	for (const page of wikiCatalog.pages ?? []) {
		const src = resolve(root, page.document)
		const route = `/wiki/${page.id}.md`
		const raw = await readFile(src, 'utf8')
		await writeToTargets(route, mdxToCleanMarkdown(raw, page.title))
	}

	const mythicalSrc = resolve(root, '.smithers/history/MYTHICAL.md')
	await writeToTargets('/wiki/mythical-history.md', await readFile(mythicalSrc, 'utf8'))

	const llms = await renderLlmsTxt(root)
	await writeToTargets('/llms.txt', llms)

	return { count: written.length, routes: written, targetDirs }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const result = await emitDocsMarkdown()
	console.log(`emitted ${result.count} markdown docs and llms.txt into ${result.targetDirs.join(', ')}`)
}
