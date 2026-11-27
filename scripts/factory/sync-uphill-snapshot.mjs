#!/usr/bin/env node
/**
 * Extracts a compact, deterministic Lighthouse-style audit snapshot from
 * .uphill/report.json into .agents/uphill/lighthouse-snapshot.json so the
 * TEVM Factory Portal renders real Uphill gauges without requiring uphill
 * to execute during static Vite builds.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assert, readJson, repositoryRoot } from './lib.mjs'

const reportPath = resolve(repositoryRoot, '.uphill/report.json')
const snapshotPath = resolve(repositoryRoot, '.agents/uphill/lighthouse-snapshot.json')

const report = await readJson(reportPath)
assert(Array.isArray(report.categories) && report.categories.length > 0, '.uphill/report.json has no categories')

const categories = report.categories.map((cat) => ({
	id: cat.name,
	title: cat.title,
	description: cat.description ?? '',
	score: Math.round(Number(cat.score ?? 0)),
	metrics: (cat.metrics ?? []).map((m) => {
		const items = Array.isArray(m.items) ? m.items : []
		const passed =
			m.kind === 'check'
				? items.filter((item) => item.value === true).length
				: items.filter((item) => {
						const target = item.target ?? m.target
						if (target === null || target === undefined || typeof item.value !== 'number') return true
						return m.better === 'higher' ? item.value >= target : item.value <= target
					}).length
		return {
			id: m.name,
			title: m.title,
			description: m.description ?? '',
			kind: m.kind,
			score: Math.round(Number(m.score ?? 0)),
			weight: Number(m.weight ?? 1),
			passed,
			total: items.length,
		}
	}),
}))

const opportunities = (report.opportunities ?? []).slice(0, 8).map((opp) => ({
	category: opp.category,
	metric: opp.metric,
	item: opp.item ?? null,
	items: Number(opp.items ?? 1),
	value: opp.value,
	target: opp.target,
	gain: Math.round(Number(opp.gain ?? 0)),
}))

const snapshot = {
	schemaVersion: 1,
	tool: 'uphill',
	overallScore: Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length),
	categories,
	opportunities,
}

const rendered = `${JSON.stringify(snapshot, null, '\t')}\n`
const write = process.argv.includes('--write')
if (write) {
	await writeFile(snapshotPath, rendered)
	console.log(
		`wrote .agents/uphill/lighthouse-snapshot.json (overall ${snapshot.overallScore}: ${categories.map((c) => `${c.id}=${c.score}`).join(', ')})`,
	)
} else {
	const current = await readFile(snapshotPath, 'utf8')
	assert(
		current === rendered,
		'.agents/uphill/lighthouse-snapshot.json is stale; run node scripts/factory/sync-uphill-snapshot.mjs --write',
	)
	console.log(`lighthouse snapshot ok: overall ${snapshot.overallScore}`)
}
