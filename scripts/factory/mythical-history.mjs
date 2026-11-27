#!/usr/bin/env node
/**
 * Validates .smithers/history/mythical.json and renders/checks .smithers/history/MYTHICAL.md.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assert, readJson, repositoryRoot } from './lib.mjs'

/**
 * Renders the canonical MYTHICAL.md view from .smithers/history/mythical.json.
 * @param {any} history
 */
export function renderMythicalMarkdown(history) {
	const lines = [
		'<!-- Generated from .smithers/history/mythical.json by scripts/factory/mythical-history.mjs --write. Do not hand-edit. -->',
		'',
		'# TEVM Mythical History',
		'',
		history.purpose,
		'',
		'```mermaid',
		'flowchart LR',
	]
	history.epics.forEach((epic, idx) => {
		const id = `E${idx + 1}`
		const label = epic.title.replace(/"/g, "'")
		lines.push(`  ${id}["${label}"]`)
		if (idx > 0) lines.push(`  E${idx} --> ${id}`)
	})
	lines.push('```', '')

	for (const epic of history.epics) {
		lines.push(`## ${epic.title}`, '', epic.summary, '')
		for (const chapter of epic.chapters) {
			const commits = chapter.provenanceCommits.map((c) => `\`${c}\``).join(', ')
			const paths = chapter.paths.map((p) => `\`${p}\``).join(', ')
			lines.push(`### ${chapter.title}`, '')
			lines.push(`- **Owning paths**: ${paths}`)
			lines.push(`- **Provenance**: ${commits}`)
			lines.push(`- **Design note**: ${chapter.notes}`, '')
		}
		if (epic.abandonedExperiments?.length) {
			lines.push('**Retained notes on superseded experiments:**', '')
			for (const note of epic.abandonedExperiments) {
				lines.push(`- ${note}`)
			}
			lines.push('')
		}
	}
	return `${lines.join('\n').trimEnd()}\n`
}

/**
 * Validates mythical.json and optionally writes or drift-checks MYTHICAL.md.
 * @param {{ root?: string, write?: boolean }} [options]
 */
export async function syncMythicalHistory({ root = repositoryRoot, write = false } = {}) {
	const jsonPath = resolve(root, '.smithers/history/mythical.json')
	const mdPath = resolve(root, '.smithers/history/MYTHICAL.md')
	const history = await readJson(jsonPath)

	assert(history.schemaVersion === 1, 'mythical.json must use schemaVersion 1')
	assert(history.repository === 'evmts/tevm', 'mythical.json repository must be evmts/tevm')
	assert(Array.isArray(history.epics) && history.epics.length >= 4, 'mythical.json must declare at least 4 epics')

	const epicIds = new Set()
	const chapterIds = new Set()
	for (const epic of history.epics) {
		assert(typeof epic.id === 'string' && !epicIds.has(epic.id), `duplicate epic id: ${epic.id}`)
		epicIds.add(epic.id)
		assert(Array.isArray(epic.chapters) && epic.chapters.length > 0, `epic ${epic.id} must have chapters`)
		for (const chapter of epic.chapters) {
			assert(typeof chapter.id === 'string' && !chapterIds.has(chapter.id), `duplicate chapter id: ${chapter.id}`)
			chapterIds.add(chapter.id)
			assert(Array.isArray(chapter.paths) && chapter.paths.length > 0, `chapter ${chapter.id} missing paths`)
			for (const p of chapter.paths) {
				assert(existsSync(resolve(root, p)), `mythical chapter ${chapter.id} references missing path: ${p}`)
			}
			assert(
				Array.isArray(chapter.provenanceCommits) && chapter.provenanceCommits.length > 0,
				`chapter ${chapter.id} missing provenanceCommits`,
			)
		}
	}

	const rendered = renderMythicalMarkdown(history)
	if (write) {
		await writeFile(mdPath, rendered)
	} else {
		const current = existsSync(mdPath) ? await readFile(mdPath, 'utf8') : ''
		assert(
			current === rendered,
			'.smithers/history/MYTHICAL.md drifted from mythical.json; run node scripts/factory/mythical-history.mjs --write',
		)
	}
	return { ok: true, epics: history.epics.length, chapters: chapterIds.size }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const write = process.argv.includes('--write')
	const result = await syncMythicalHistory({ write })
	console.log(`mythical history ${write ? 'wrote' : 'ok'}: ${result.epics} epics, ${result.chapters} chapters`)
}
