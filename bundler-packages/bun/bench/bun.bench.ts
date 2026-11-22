import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform } from 'node:os'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bunPluginTevm } from '../src/index.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(scriptDir, '..')
const repoRoot = resolve(pkgDir, '../..')
const relDir = relative(repoRoot, pkgDir).split('\\').join('/')
const pkgJson = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8'))

const runBench = (suite: string, name: string, fn: () => void) => {
	const warmEnd = performance.now() + 50
	while (performance.now() < warmEnd) fn()
	const samples: number[] = []
	const deadline = performance.now() + 200
	while (performance.now() < deadline || samples.length < 10) {
		const t0 = performance.now()
		fn()
		samples.push(performance.now() - t0)
	}
	samples.sort((a, b) => a - b)
	const n = samples.length
	const meanMs = samples.reduce((a, b) => a + b, 0) / n
	const hz = meanMs > 0 ? 1000 / meanMs : 0
	return {
		suite,
		name,
		hz: Number(hz.toFixed(2)),
		meanMs: Number(meanMs.toFixed(6)),
		medianMs: Number(samples[Math.floor(n / 2)]!.toFixed(6)),
		p75Ms: Number(samples[Math.floor((n * 75) / 100)]!.toFixed(6)),
		p99Ms: Number(samples[Math.min(n - 1, Math.floor((n * 99) / 100))]!.toFixed(6)),
		minMs: Number(samples[0]!.toFixed(6)),
		maxMs: Number(samples[n - 1]!.toFixed(6)),
		rme: 0,
		samples: n,
	}
}

const benchmarks = [
	runBench('@tevm/bun-plugin', 'bunPluginTevm() instantiation (real Bun runtime)', () => {
		const plugin = bunPluginTevm({})
		if (!plugin.name || typeof plugin.setup !== 'function') throw new Error('unexpected')
	}),
]

const artifactsDir = resolve(pkgDir, 'artifacts')
if (!existsSync(artifactsDir)) mkdirSync(artifactsDir, { recursive: true })
const outPath = resolve(artifactsDir, 'bench.json')
writeFileSync(
	outPath,
	`${JSON.stringify(
		{
			schemaVersion: 1,
			package: pkgJson.name ?? relDir,
			dir: relDir,
			runner: 'bun',
			nodeVersion: process.version,
			platform: `${platform()}-${process.arch}`,
			cpu: cpus()[0]?.model?.trim() ?? 'unknown',
			benchmarks,
		},
		null,
		2,
	)}\n`,
	'utf8',
)
console.log(`\n[@tevm/bun-plugin] ${benchmarks.length} Bun benchmark(s) -> ${relative(repoRoot, outPath)}`)
for (const b of benchmarks) {
	console.log(`  ${b.name.padEnd(54)} ${b.hz.toFixed(1).padStart(11)}/s  mean=${b.meanMs.toFixed(4)}ms`)
}
