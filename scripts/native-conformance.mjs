#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, globSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const targets = process.argv.slice(2)
if (!targets.length || targets.some((target) => !/^(specs(?:-[a-z0-9-]+)?|test-trace)$/.test(target))) {
	throw new Error('Usage: node scripts/native-conformance.mjs <guillotine-mini specs target or test-trace> [...]')
}
const cwd = fileURLToPath(new URL('../../guillotine-mini/', import.meta.url))
const fixtures = new Map([
	['specs-cancun-tstore-basic', 'for_cancun/cancun/eip1153_tstore/tstorage'],
	['specs-berlin-intrinsic-gas-cost', 'for_berlin/berlin/eip2930_access_list/acl/transaction_intrinsic_gas_cost.json'],
])

/** @param {string} target */
async function run(target) {
	const fixture = fixtures.get(target)
	if (fixture) {
		const corpus =
			process.env.TEVM_EXECUTION_SPEC_TESTS_FIXTURES ??
			fileURLToPath(new URL('../.cache/conformance-corpus/execution-spec-tests/fixtures/state_tests/', import.meta.url))
		if (!existsSync(corpus) && !process.env.TEVM_EXECUTION_SPEC_TESTS_FIXTURES) {
			await import('./factory/fetch-conformance-corpus.mjs')
		}
		// The pinned generator scans this directory. Isolate the filled EEST vectors
		// from its bundled filler templates and select only the resulting Zig tests.
		const stateTests = join(cwd, 'execution-specs/tests/eest/static/state_tests')
		mkdirSync(stateTests, { recursive: true })
		const stage = mkdtempSync(join(stateTests, 'tevm_'))
		try {
			const source = resolve(corpus, fixture)
			cpSync(source, join(stage, basename(source)), { recursive: true })
			const expected = globSync('**/*.json', { cwd: stage }).reduce(
				(count, file) => count + Object.keys(JSON.parse(readFileSync(join(stage, file), 'utf8'))).length,
				0,
			)
			if (!expected) throw new Error(`No filled vectors found in ${source}`)
			const result = spawnSync('zig', ['build', 'specs'], {
				cwd,
				env: { ...process.env, TEST_FILTER: basename(stage), TEST_FORMAT: 'json' },
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'inherit'],
				maxBuffer: 32 * 1024 * 1024,
			})
			if (result.error) throw result.error
			process.stdout.write(result.stdout)
			if (result.status !== 0) {
				process.exitCode = result.status ?? 1
			} else {
				const summary = result.stdout.split('\n').find((line) => line.startsWith('{"success":'))
				const report = summary && JSON.parse(summary)
				if (!report?.success || report.passed !== expected) {
					throw new Error(`Expected ${expected} passing EEST vectors for ${target}`)
				}
			}
		} finally {
			rmSync(stage, { recursive: true, force: true })
		}
	} else {
		const result = spawnSync('zig', ['build', target], { cwd, stdio: 'inherit' })
		if (result.error) throw result.error
		if (result.status !== 0) process.exitCode = result.status ?? 1
	}
}

for (const target of targets) {
	try {
		await run(target)
	} catch (error) {
		console.error(error)
		process.exitCode = 1
	}
}
