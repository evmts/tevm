#!/usr/bin/env node
/**
 * Generates docs/node/public/llms.txt from docs/node/pages/ and .smithers/coding-project.json
 * so https://node.tevm.sh/llms.txt powers Smithers Cloud's Docs tab and MCP docs_list/docs_read.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assert, readJson, repositoryRoot } from './lib.mjs'

const DOCS_ORIGIN = 'https://node.tevm.sh'
const SMITHERS_REPO = 'https://smithers.sh/evmts/tevm'
const PAGES_ROOT = resolve(repositoryRoot, 'docs/node/pages')
const OUTPUT_PATH = resolve(repositoryRoot, 'docs/node/public/llms.txt')

async function listMdx(dir) {
	const out = []
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = resolve(dir, entry.name)
		if (entry.isDirectory()) out.push(...(await listMdx(full)))
		else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) out.push(full)
	}
	return out.sort()
}

function extractTitle(content, fallback) {
	const fmTitle = /^title:\s*["']?([^"'\n]+)["']?/m.exec(content)?.[1]?.trim()
	if (fmTitle) return fmTitle
	const h1 = /^#\s+(.+)$/m.exec(content)?.[1]?.trim()
	if (h1) return h1
	return fallback
}

function pageRoute(file) {
	const rel = relative(PAGES_ROOT, file)
		.replaceAll('\\', '/')
		.replace(/\.(?:mdx|md)$/, '')
	if (rel === 'index') return '/'
	if (rel.endsWith('/index')) return `/${rel.slice(0, -'/index'.length)}`
	return `/${rel}`
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
 * Renders deterministic llms.txt markdown index.
 * @param {string} [root]
 */
export async function renderLlmsTxt(root = repositoryRoot) {
	const pagesDir = resolve(root, 'docs/node/pages')
	const files = await listMdx(pagesDir)
	const wikiCatalog = await readJson(resolve(root, '.smithers/coding-project.json'))

	/** @type {Map<string, Array<{ title: string, url: string }>>} */
	const grouped = new Map()
	for (const file of files) {
		const rel = relative(pagesDir, file).replaceAll('\\', '/')
		const top = rel.includes('/') ? rel.split('/')[0] : 'introduction'
		const content = await readFile(file, 'utf8')
		const route = pageRoute(file)
		const title = extractTitle(content, route === '/' ? 'TEVM Node' : (route.split('/').at(-1) ?? 'Guide'))
		const list = grouped.get(top) ?? []
		list.push({ title, url: `${DOCS_ORIGIN}${route}` })
		grouped.set(top, list)
	}

	const lines = [
		'# TEVM',
		'',
		'> In-memory Ethereum Virtual Machine and full node for TypeScript, powered by native Zig (ZEVM) and Viem. Built publicly on Smithers Cloud.',
		'',
		`- Public Coding Factory: ${SMITHERS_REPO}`,
		`- Authenticated MCP Endpoint: ${SMITHERS_REPO}/mcp`,
		`- Shared Build Object Store: https://build.smithers.sh`,
		'- GitHub Mirror: https://github.com/evmts/tevm',
		'',
	]

	const orderedKeys = ['introduction', 'getting-started', 'core', 'api', 'examples', 'advanced', 'reference']
	for (const key of orderedKeys) {
		const entries = grouped.get(key)
		if (!entries?.length) continue
		lines.push(`## ${sectionTitles[key] ?? key}`, '')
		for (const item of entries) {
			lines.push(`- [${item.title}](${item.url})`)
		}
		lines.push('')
	}

	lines.push('## Engineering Wiki and Mythical History', '')
	for (const page of wikiCatalog.pages ?? []) {
		lines.push(`- [${page.title}](${SMITHERS_REPO}/blob/main/${page.document}): ${page.purpose}`)
	}
	lines.push(
		`- [Mythical History](${SMITHERS_REPO}/blob/main/.smithers/history/MYTHICAL.md): Clean from-scratch epic timeline of TEVM.`,
	)
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
