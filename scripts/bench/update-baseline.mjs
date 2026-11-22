#!/usr/bin/env node
/**
 * Updates `benchmarks/baseline.json` from the latest aggregated benchmark
 * report (`artifacts/benchmarks/report.json`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')
const reportPath = resolve(repoRoot, 'artifacts/benchmarks/report.json')
const baselinePath = resolve(repoRoot, 'benchmarks/baseline.json')

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const baseline = {
	schemaVersion: 1,
	packages: report.packages.map((pkg) => ({
		package: pkg.package,
		dir: pkg.dir,
		runner: pkg.runner,
		benchmarks: pkg.benchmarks.map((b) => ({
			suite: b.suite,
			name: b.name,
			hz: b.hz,
			meanMs: b.meanMs,
			medianMs: b.medianMs,
			p99Ms: b.p99Ms,
		})),
	})),
}

mkdirSync(dirname(baselinePath), { recursive: true })
writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
console.log(`Updated ${baselinePath} (${baseline.packages.length} packages, ${report.benchmarkCount} benchmarks)`)
