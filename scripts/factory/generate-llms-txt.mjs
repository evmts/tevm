#!/usr/bin/env node
/**
 * Generates docs/node/public/llms.txt from docs/node/pages/ and .smithers/coding-project.json
 * using canonical `.md` routes on https://node.tevm.sh so Smithers Cloud's in-app Docs tab
 * (which only fetches same-origin Markdown files listed in llms.txt) renders every TEVM doc,
 * Engineering Wiki page, and Mythical History chapter natively.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assert, readJson, repositoryRoot } from './lib.mjs'

export const DOCS_ORIGIN = 'https://node.tevm.sh'
const SMITHERS_REPO = 'https://smithers.sh/evmts/tevm'
const OUTPUT_PATH = resolve(repositoryRoot, 'docs/node/public/llms.txt')

/**
 * Lists all .md/.mdx files under a directory sorted deterministically.
 * @param {string} dir
 */
export async function listDocFiles(dir) {
	const out = []
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = resolve(dir, entry.name)
		if (entry.isDirectory()) out.push(...(await listDocFiles(full)))
		else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) out.push(full)
	}
	return out.sort()
}

/**
 * Extracts a human-readable title from YAML frontmatter or the first Markdown H1.
 * @param {string} content
 * @param {string} fallback
 */
export function extractDocTitle(content, fallback) {
	const fmTitle = /^title:\s*["']?([^"'\n]+)["']?/m.exec(content)?.[1]?.trim()
	if (fmTitle) return fmTitle
	const h1 = /^#\s+(.+)$/m.exec(content)?.[1]?.trim()
	if (h1) return h1
	return fallback
}

/**
 * Extracts an optional one-line description from YAML frontmatter.
 * @param {string} content
 */
export function extractDocDescription(content) {
	const fmDesc = /^description:\s*["']?([^"'\n]+)["']?/m.exec(content)?.[1]?.trim()
	return fmDesc || ''
}

/**
 * Maps a docs/node/pages file to its served .md path (never bare "/").
 * @param {string} pagesRoot
 * @param {string} file
 */
export function pageMarkdownRoute(pagesRoot, file) {
	const rel = relative(pagesRoot, file)
		.replaceAll('\\', '/')
		.replace(/\.(?:mdx|md)$/, '')
	if (rel === 'index') return '/index.md'
	if (rel.endsWith('/index')) return `/${rel.slice(0, -'/index'.length)}.md`
	return `/${rel}.md`
}

const sectionTitles = {
	introduction: 'Introduction',
	'getting-started': 'Getting Started',
	core: 'Core Architecture',
	api: 'API Reference',
	examples: 'Examples',
	advanced: 'Advanced Guides',
	reference: 'Package & CLI Reference',
}

/**
 * Renders deterministic llms.txt markdown index with same-origin .md links.
 * @param {string} [root]
 */
export async function renderLlmsTxt(root = repositoryRoot) {
	const pagesDir = resolve(root, 'docs/node/pages')
	const files = await listDocFiles(pagesDir)
	const wikiCatalog = await readJson(resolve(root, '.smithers/coding-project.json'))

	/** @type {Map<string, Array<{ title: string, url: string, description: string }>>} */
	const grouped = new Map()
	for (const file of files) {
		const rel = relative(pagesDir, file).replaceAll('\\', '/')
		const top = rel.includes('/') ? rel.split('/')[0] : 'introduction'
		const content = await readFile(file, 'utf8')
		const mdRoute = pageMarkdownRoute(pagesDir, file)
		const fallback = mdRoute === '/index.md' ? 'TEVM Node' : (mdRoute.replace(/\.md$/, '').split('/').at(-1) ?? 'Guide')
		const title = extractDocTitle(content, fallback)
		const description = extractDocDescription(content)
		const list = grouped.get(top) ?? []
		list.push({ title, url: `${DOCS_ORIGIN}${mdRoute}`, description })
		grouped.set(top, list)
	}

	const lines = [
		'# TEVM',
		'',
		'> In-memory Ethereum Virtual Machine and full node for TypeScript, powered by native Zig (ZEVM) and Viem. Built publicly on Smithers Cloud.',
		'',
		`- Public Coding Factory: ${SMITHERS_REPO}`,
		`- Authenticated MCP Endpoint: ${SMITHERS_REPO}/mcp`,
		'- Shared Build Object Store: https://build.smithers.sh',
		'- GitHub Mirror: https://github.com/evmts/tevm',
		'',
	]

	const orderedKeys = ['introduction', 'getting-started', 'core', 'api', 'examples', 'advanced', 'reference']
	for (const key of orderedKeys) {
		const entries = grouped.get(key)
		if (!entries?.length) continue
		lines.push(`## ${sectionTitles[key] ?? key}`, '')
		for (const item of entries) {
			lines.push(
				item.description ? `- [${item.title}](${item.url}): ${item.description}` : `- [${item.title}](${item.url})`,
			)
		}
		lines.push('')
	}

	lines.push('## Engineering Wiki and Mythical History', '')
	for (const page of wikiCatalog.pages ?? []) {
		lines.push(`- [${page.title}](${DOCS_ORIGIN}/wiki/${page.id}.md): ${page.purpose}`)
	}
	lines.push(`- [Mythical History](${DOCS_ORIGIN}/wiki/mythical-history.md): Clean from-scratch epic timeline of TEVM.`)
	lines.push('')

	return `${lines.join('\n').trimEnd()}\n`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const write = process.argv.includes('--write')
	const rendered = await renderLlmsTxt(repositoryRoot)
	if (write) {
		await mkdir(dirname(OUTPUT_PATH), { recursive: true })
		await writeFile(OUTPUT_PATH, rendered)
		console.log(`wrote docs/node/public/llms.txt (${rendered.split('\n').length} lines)`)
	} else {
		const current = existsSync(OUTPUT_PATH) ? await readFile(OUTPUT_PATH, 'utf8') : ''
		assert(
			current === rendered,
			'docs/node/public/llms.txt is stale; run node scripts/factory/generate-llms-txt.mjs --write',
		)
		console.log(`llms.txt ok (${rendered.split('\n').length} lines)`)
	}
}
