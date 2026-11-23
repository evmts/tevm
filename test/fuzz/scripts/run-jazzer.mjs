#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const fuzzRoot = resolve(here, '..')
const jazzerBin = resolve(fuzzRoot, 'node_modules/.bin/jazzer')

const targets = [
	{ name: 'ipc-framing', file: 'jazzer/ipc-framing.fuzz.mjs', includes: ['packages/server'] },
	{ name: 'request-body', file: 'jazzer/request-body.fuzz.mjs', includes: ['packages/server'] },
	{
		name: 'bundler-parsers',
		file: 'jazzer/bundler-parsers.fuzz.mjs',
		includes: ['packages/effect', 'bundler-packages/whatsabi'],
	},
	{ name: 'runtime-codegen', file: 'jazzer/runtime-codegen.fuzz.mjs', includes: ['bundler-packages/runtime'] },
	{ name: 'mcp-tools', file: 'jazzer/mcp-tools.fuzz.mjs', includes: ['packages/mcp'] },
	{ name: 'jsonrpc-fetcher', file: 'jazzer/jsonrpc-fetcher.fuzz.mjs', includes: ['packages/jsonrpc'] },
	{ name: 'zevm-rpc', file: 'jazzer/zevm-rpc.fuzz.mjs', includes: ['packages/node'] },
]

const filter = process.env['JAZZER_TARGET']
const seconds = Number.parseInt(process.env['JAZZER_SECONDS'] ?? '5', 10)
const runs = Number.parseInt(process.env['JAZZER_RUNS'] ?? '0', 10)

const selected = filter ? targets.filter((t) => t.name.includes(filter)) : targets
if (selected.length === 0) {
	console.error(`No Jazzer.js target matched JAZZER_TARGET=${filter}`)
	process.exit(1)
}

let failures = 0
for (const target of selected) {
	const seedDir = resolve(fuzzRoot, '__fuzz__/jazzer', target.name)
	const corpusDir = resolve(fuzzRoot, 'node_modules/.cache/jazzer-corpus', target.name)
	mkdirSync(seedDir, { recursive: true })
	mkdirSync(corpusDir, { recursive: true })
	const args = [
		resolve(fuzzRoot, target.file),
		corpusDir,
		seedDir,
		...target.includes.flatMap((inc) => ['-i', inc]),
		'--',
		`-max_total_time=${seconds}`,
		...(runs > 0 ? [`-runs=${runs}`] : []),
		'-print_final_stats=1',
	]
	console.log(`\n=== Jazzer.js coverage-guided target: ${target.name} (${seconds}s) ===`)
	const res = spawnSync(jazzerBin, args, {
		cwd: fuzzRoot,
		stdio: 'inherit',
		env: process.env,
	})
	if (res.status !== 0) {
		console.error(`Jazzer.js target "${target.name}" FAILED with exit code ${res.status}`)
		failures++
	}
}

if (failures > 0) {
	console.error(`\n${failures} Jazzer.js fuzz target(s) found failures.`)
	process.exit(1)
}
console.log(`\nAll ${selected.length} Jazzer.js coverage-guided targets passed cleanly.`)
