#!/usr/bin/env node
/**
 * Prints the aggregated benchmark summary to stdout (and appends to
 * `$GITHUB_STEP_SUMMARY` in CI) so `smthrs target //:bench` always displays
 * current numbers even when every package benchmark was a cache hit.
 */
import { appendFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')
const summaryPath = resolve(repoRoot, 'artifacts/benchmarks/summary.md')
const summary = readFileSync(summaryPath, 'utf8')

process.stdout.write(summary)
if (process.env.GITHUB_STEP_SUMMARY) {
	appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, 'utf8')
}
console.log(`\nHTML dashboard: ${resolve(repoRoot, 'artifacts/benchmarks/report.html')}`)
