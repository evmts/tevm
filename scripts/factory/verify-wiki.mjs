#!/usr/bin/env node
/**
 * Validates .smithers/coding-project.json and the Obsidian-compatible wiki
 * under .smithers/wiki/:
 * - Every catalog page's document and input files exist inside the repo
 * - No secret, credential, database, or forbidden hidden paths appear in inputs
 * - Every [[wikilink]] across .smithers/wiki/** resolves to an existing page or decision
 */
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assert, readJson, repositoryRoot } from './lib.mjs'

const FORBIDDEN_INPUT_RE =
	/(?:Smithers-Ops|node_modules|credentials\.json|service-account|\.env$|\.token$|\.pem$|\.key$|\.db$|\.sqlite$|secrets?\.(?:json|ya?ml|toml)$)/i
const WIKILINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g

async function listMarkdown(dir) {
	const out = []
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = resolve(dir, entry.name)
		if (entry.isDirectory()) out.push(...(await listMarkdown(full)))
		else if (entry.name.endsWith('.md')) out.push(full)
	}
	return out.sort()
}

/**
 * Audits TEVM's Obsidian engineering wiki and catalog.
 * @param {string} [root]
 */
export async function verifyWiki(root = repositoryRoot) {
	const catalogPath = resolve(root, '.smithers/coding-project.json')
	const wikiRoot = resolve(root, '.smithers/wiki')
	const catalog = await readJson(catalogPath)
	assert(catalog.wiki === true, '.smithers/coding-project.json must set wiki: true')
	assert(
		Array.isArray(catalog.pages) && catalog.pages.length >= 5 && catalog.pages.length <= 30,
		'wiki catalog must declare 5..30 pages',
	)

	const pageIds = new Set()
	for (const page of catalog.pages) {
		assert(typeof page.id === 'string' && !pageIds.has(page.id), `duplicate or invalid wiki page id: ${page.id}`)
		pageIds.add(page.id)
		assert(
			typeof page.document === 'string' && existsSync(resolve(root, page.document)),
			`missing wiki document: ${page.document}`,
		)
		assert(Array.isArray(page.inputs) && page.inputs.length > 0, `wiki page ${page.id} must declare at least one input`)
		for (const input of page.inputs) {
			assert(!FORBIDDEN_INPUT_RE.test(input), `forbidden wiki input path: ${input}`)
			assert(existsSync(resolve(root, input)), `wiki page ${page.id} input does not exist: ${input}`)
		}
	}
	for (const page of catalog.pages) {
		for (const rel of page.related ?? []) {
			assert(pageIds.has(rel), `wiki page ${page.id} references unknown related page "${rel}"`)
		}
	}

	const mdFiles = await listMarkdown(wikiRoot)
	const knownTargets = new Set(mdFiles.map((file) => basename(file, '.md')))
	let linkCount = 0
	for (const file of mdFiles) {
		const text = await readFile(file, 'utf8')
		for (const match of text.matchAll(WIKILINK_RE)) {
			const target = match[1].trim()
			linkCount += 1
			assert(knownTargets.has(target), `broken wikilink [[${target}]] in ${file}`)
		}
	}

	return {
		ok: true,
		pages: catalog.pages.length,
		markdownFiles: mdFiles.length,
		wikilinks: linkCount,
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const result = await verifyWiki()
	console.log(
		`wiki ok: ${result.pages} catalog pages, ${result.markdownFiles} markdown files, ${result.wikilinks} verified wikilinks`,
	)
}
