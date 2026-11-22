#!/usr/bin/env node
/**
 * Unified TEVM multi-engine fuzzing campaign orchestrator:
 *   1. Vitest + fast-check property & stateful model-based EVM fuzzing
 *   2. @smthrs/fuzz Effect feedback-guided fuzzing + FuzzSimulation interleavings
 *   3. Jazzer.js native LibFuzzer V8 coverage-guided fuzzing
 *   4. Rust proptest property fuzzing across resolutions-rs, runtime-rs, solc-rs
 *   5. Optional native Linux Zig `--fuzz` (locally on Linux or on Latitude Ubuntu host)
 */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const fuzzPkg = resolve(repoRoot, 'test/fuzz')

const args = new Set(process.argv.slice(2))
const intensive = args.has('--intensive')
const includeZig = args.has('--zig') || process.env['TEVM_FUZZ_INCLUDE_ZIG'] === '1'
const skipJazzer = args.has('--skip-jazzer')
const skipRust = args.has('--skip-rust')

const env = {
	...process.env,
	...(intensive
		? {
				TEVM_FUZZ_MODE: 'campaign',
				TEVM_FUZZ_RUNS: process.env['TEVM_FUZZ_RUNS'] ?? '500',
				TEVM_FUZZ_IO_RUNS: process.env['TEVM_FUZZ_IO_RUNS'] ?? '120',
				TEVM_FUZZ_MODEL_RUNS: process.env['TEVM_FUZZ_MODEL_RUNS'] ?? '50',
				TEVM_FUZZ_EFFECT_EXECUTIONS: process.env['TEVM_FUZZ_EFFECT_EXECUTIONS'] ?? '5000',
				JAZZER_SECONDS: process.env['JAZZER_SECONDS'] ?? '15',
				TEVM_ZIG_FUZZ_SECONDS: process.env['TEVM_ZIG_FUZZ_SECONDS'] ?? '30',
			}
		: {
				JAZZER_SECONDS: process.env['JAZZER_SECONDS'] ?? '5',
				TEVM_ZIG_FUZZ_SECONDS: process.env['TEVM_ZIG_FUZZ_SECONDS'] ?? '15',
			}),
}

const stages = []
const runStage = (name, cmd, cmdArgs, cwd = repoRoot) => {
	const started = Date.now()
	console.log(`\n============================================================`)
	console.log(`[FUZZ STAGE] ${name}`)
	console.log(`============================================================`)
	const res = spawnSync(cmd, cmdArgs, { cwd, env, stdio: 'inherit' })
	const elapsedSec = ((Date.now() - started) / 1000).toFixed(1)
	stages.push({ name, ok: res.status === 0, elapsedSec })
	if (res.status !== 0) {
		console.error(`[FUZZ STAGE FAILED] ${name} (${elapsedSec}s, exit=${res.status})`)
		process.exit(res.status ?? 1)
	}
	console.log(`[FUZZ STAGE PASSED] ${name} (${elapsedSec}s)`)
}

runStage(
	'TypeScript / Native ZEVM Property + Stateful Model + @smthrs/fuzz Effect Feedback',
	resolve(fuzzPkg, 'node_modules/.bin/vitest'),
	['run'],
	fuzzPkg,
)

if (!skipJazzer) {
	runStage(
		'Jazzer.js Native LibFuzzer Coverage-Guided Fuzzing',
		process.execPath,
		[resolve(fuzzPkg, 'scripts/run-jazzer.mjs')],
		fuzzPkg,
	)
}

if (!skipRust) {
	runStage('Rust Crate Proptest Fuzzing (resolutions-rs, runtime-rs, solc-rs)', 'cargo', [
		'test',
		'--workspace',
		'fuzz_',
	])
}

if (includeZig) {
	runStage('Native Zig Coverage-Guided Fuzzing (Linux / Bare-Metal Ubuntu)', process.execPath, [
		resolve(here, 'run-zig-fuzz-remote.mjs'),
	])
}

console.log('\n==================== FUZZ CAMPAIGN SUMMARY ====================')
for (const s of stages) {
	console.log(`  PASS  ${s.name} (${s.elapsedSec}s)`)
}
console.log('===============================================================')
