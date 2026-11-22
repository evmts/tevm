#!/usr/bin/env node
/**
 * Runs a package's Vitest benchmarks and writes a normalized JSON report to
 * `artifacts/bench.json` (relative to the package directory).
 *
 * Designed to run as a Smithers `Shell.Build` target with
 * `outFiles: ['artifacts/bench.json']` so unchanged packages cache-hit and
 * restore their benchmark artifact automatically.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { cpus, platform } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')
const pkgDir = process.cwd()
const relDir = relative(repoRoot, pkgDir).split('\\').join('/')
const pkgJsonPath = resolve(pkgDir, 'package.json')
const pkgJson = existsSync(pkgJsonPath) ? JSON.parse(readFileSync(pkgJsonPath, 'utf8')) : { name: relDir }

const artifactsDir = resolve(pkgDir, 'artifacts')
mkdirSync(artifactsDir, { recursive: true })
const rawJsonPath = resolve(artifactsDir, 'vitest-bench-raw.json')
const outJsonPath = resolve(artifactsDir, 'bench.json')

if (existsSync(rawJsonPath)) rmSync(rawJsonPath, { force: true })

const vitestBin = resolve(repoRoot, 'node_modules/.bin/vitest')
const benchConfig = resolve(repoRoot, 'configs/vitest.bench.config.ts')

const args = ['bench', '--run', '--root', pkgDir, '--config', benchConfig, '--outputJson', rawJsonPath]

try {
	execFileSync(vitestBin, args, {
		cwd: pkgDir,
		stdio: 'inherit',
		env: {
			...process.env,
			NODE_ENV: process.env.NODE_ENV ?? 'test',
		},
	})
} catch (error) {
	if (existsSync(rawJsonPath)) rmSync(rawJsonPath, { force: true })
	throw error
}

if (!existsSync(rawJsonPath)) {
	throw new Error(`vitest bench did not produce ${rawJsonPath} for ${pkgJson.name ?? relDir}`)
}

const raw = JSON.parse(readFileSync(rawJsonPath, 'utf8'))
rmSync(rawJsonPath, { force: true })

/** @type {Array<{ suite: string, name: string, hz: number, meanMs: number, medianMs: number, p75Ms: number, p99Ms: number, minMs: number, maxMs: number, rme: number, samples: number }>} */
const benchmarks = []
const failed = []

for (const file of raw.files ?? []) {
	for (const group of file.groups ?? []) {
		const suite = String(group.fullName ?? '').replace(/^bench\/[^ ]+\s*>\s*/, '') || relDir
		for (const item of group.benchmarks ?? []) {
			if (typeof item.hz !== 'number' || !Number.isFinite(item.hz) || item.hz <= 0) {
				failed.push(`${suite} > ${item.name} (invalid hz=${item.hz}; benchmark likely threw)`)
				continue
			}
			benchmarks.push({
				suite,
				name: item.name,
				hz: Number(item.hz.toFixed(2)),
				meanMs: Number((item.mean ?? 0).toFixed(6)),
				medianMs: Number((item.median ?? 0).toFixed(6)),
				p75Ms: Number((item.p75 ?? 0).toFixed(6)),
				p99Ms: Number((item.p99 ?? 0).toFixed(6)),
				minMs: Number((item.min ?? 0).toFixed(6)),
				maxMs: Number((item.max ?? 0).toFixed(6)),
				rme: Number((item.rme ?? 0).toFixed(2)),
				samples: Number(item.sampleCount ?? 0),
			})
		}
	}
}

if (failed.length > 0) {
	throw new Error(`Benchmark failures in ${pkgJson.name ?? relDir}:\n  - ${failed.join('\n  - ')}`)
}

if (benchmarks.length === 0) {
	throw new Error(`No benchmarks executed in ${pkgJson.name ?? relDir}`)
}

const report = {
	schemaVersion: 1,
	package: pkgJson.name ?? relDir,
	dir: relDir,
	runner: 'vitest',
	nodeVersion: process.version,
	platform: `${platform()}-${process.arch}`,
	cpu: cpus()[0]?.model?.trim() ?? 'unknown',
	benchmarks,
}

writeFileSync(outJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const fmtHz = (hz) =>
	hz >= 1_000_000
		? `${(hz / 1_000_000).toFixed(2)}M/s`
		: hz >= 1_000
			? `${(hz / 1_000).toFixed(2)}k/s`
			: `${hz.toFixed(1)}/s`

console.log(`\n[${report.package}] ${benchmarks.length} benchmark(s) -> ${relative(repoRoot, outJsonPath)}`)
for (const b of benchmarks) {
	console.log(
		`  ${b.name.padEnd(54)} ${fmtHz(b.hz).padStart(11)}  mean=${b.meanMs.toFixed(4)}ms  p99=${b.p99Ms.toFixed(4)}ms  ±${b.rme.toFixed(1)}%`,
	)
}
