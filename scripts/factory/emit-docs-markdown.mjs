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
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractDocTitle, listDocFiles, pageMarkdownRoute, renderLlmsTxt } from './generate-llms-txt.mjs'
import { readJson, repositoryRoot } from './lib.mjs'

/**
 * Strips YAML frontmatter and MDX-only import/export statements while keeping
 * readable Markdown with a guaranteed top-level heading.
 * @param {string} raw
 * @param {string} fallbackTitle
 */
export function mdxToCleanMarkdown(raw, fallbackTitle) {
	const title = extractDocTitle(raw, fallbackTitle)
	let body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
	// Drop top-level ESM import lines used by Vocs JSX components
	body = body.replace(/^import\s+[^\n]+\r?\n/gm, '').trimStart()
	if (!/^#\s+/m.test(body)) {
		body = `# ${title}\n\n${body}`
	}
	return `${body.trimEnd()}\n`
}

/**
 * Writes clean .md mirrors + llms.txt into `distDir`.
 * @param {{ root?: string, distDir?: string }} [options]
 */
export async function emitDocsMarkdown({ root = repositoryRoot, distDir = resolve(root, 'docs/node/dist') } = {}) {
	const pagesDir = resolve(root, 'docs/node/pages')
	const files = await listDocFiles(pagesDir)
	const written = []

	for (const file of files) {
		const route = pageMarkdownRoute(pagesDir, file)
		const target = resolve(distDir, route.replace(/^\//, ''))
		const raw = await readFile(file, 'utf8')
		const fallback = route === '/index.md' ? 'TEVM Node' : (route.replace(/\.md$/, '').split('/').at(-1) ?? 'Guide')
		await mkdir(dirname(target), { recursive: true })
		await writeFile(target, mdxToCleanMarkdown(raw, fallback))
		written.push(route)
	}

	// Mirror Obsidian Engineering Wiki pages and Mythical History into /wiki/*.md
	const wikiCatalog = await readJson(resolve(root, '.smithers/coding-project.json'))
	for (const page of wikiCatalog.pages ?? []) {
		const src = resolve(root, page.document)
		const route = `/wiki/${page.id}.md`
		const target = resolve(distDir, route.replace(/^\//, ''))
		const raw = await readFile(src, 'utf8')
		await mkdir(dirname(target), { recursive: true })
		await writeFile(target, mdxToCleanMarkdown(raw, page.title))
		written.push(route)
	}

	const mythicalSrc = resolve(root, '.smithers/history/MYTHICAL.md')
	const mythicalRoute = '/wiki/mythical-history.md'
	await mkdir(dirname(resolve(distDir, 'wiki/mythical-history.md')), { recursive: true })
	await writeFile(resolve(distDir, 'wiki/mythical-history.md'), await readFile(mythicalSrc, 'utf8'))
	written.push(mythicalRoute)

	const llms = await renderLlmsTxt(root)
	await writeFile(resolve(distDir, 'llms.txt'), llms)
	written.push('/llms.txt')

	return { count: written.length, routes: written }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const result = await emitDocsMarkdown()
	console.log(`emitted ${result.count} markdown docs and llms.txt into docs/node/dist`)
}
