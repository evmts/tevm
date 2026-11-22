#!/usr/bin/env node
/**
 * Runs a Rust crate's release benchmark example (`bench_json`) and writes a
 * normalized `artifacts/bench.json` matching the workspace benchmark schema.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform, tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')
const pkgDir = process.cwd()
const relDir = relative(repoRoot, pkgDir).split('\\').join('/')
const pkgJsonPath = resolve(pkgDir, 'package.json')
const pkgJson = existsSync(pkgJsonPath) ? JSON.parse(readFileSync(pkgJsonPath, 'utf8')) : { name: relDir }

const cargoPkg = process.argv[2]
const exampleName = process.argv[3] ?? 'bench_json'
if (!cargoPkg) {
	throw new Error('Usage: run-cargo-bench.mjs <cargo-package-name> [example-name]')
}

const extraRustflags =
	process.platform === 'darwin'
		? '-C link-arg=-Wl,-undefined,dynamic_lookup'
		: process.platform === 'linux'
			? '-C link-arg=-Wl,--warn-unresolved-symbols'
			: ''
const rustflags = [process.env.RUSTFLAGS, extraRustflags].filter(Boolean).join(' ')
const cargoTargetDir = process.env.TEVM_CARGO_BENCH_TARGET_DIR || join(tmpdir(), 'tevm-cargo-bench-target')

const stdout = execFileSync(
	'cargo',
	[
		'run',
		'--profile',
		'bench',
		'--config',
		'profile.bench.lto=false',
		'--config',
		'profile.bench.panic="unwind"',
		'--quiet',
		'--package',
		cargoPkg,
		'--example',
		exampleName,
	],
	{
		cwd: repoRoot,
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
		env: {
			...process.env,
			CARGO_TARGET_DIR: cargoTargetDir,
			...(rustflags ? { RUSTFLAGS: rustflags } : {}),
		},
	},
)

const parsed = JSON.parse(stdout.trim())
const benchmarks = parsed.benchmarks ?? []
if (!Array.isArray(benchmarks) || benchmarks.length === 0) {
	throw new Error(`Rust benchmark ${cargoPkg} (${exampleName}) emitted no benchmarks`)
}

const artifactsDir = resolve(pkgDir, 'artifacts')
mkdirSync(artifactsDir, { recursive: true })
const outJsonPath = resolve(artifactsDir, 'bench.json')

const report = {
	schemaVersion: 1,
	package: pkgJson.name ?? cargoPkg,
	dir: relDir,
	runner: 'cargo',
	nodeVersion: process.version,
	platform: `${platform()}-${process.arch}`,
	cpu: cpus()[0]?.model?.trim() ?? 'unknown',
	benchmarks,
}

writeFileSync(outJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`\n[${report.package}] ${benchmarks.length} Rust benchmark(s) -> ${relative(repoRoot, outJsonPath)}`)
for (const b of benchmarks) {
	console.log(
		`  ${b.name.padEnd(54)} ${b.hz.toFixed(1).padStart(11)}/s  mean=${b.meanMs.toFixed(4)}ms  p99=${b.p99Ms.toFixed(4)}ms`,
	)
}
