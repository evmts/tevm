import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

test('remote runs require a host, isolate transfers, preserve literal arguments, and clean up', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'tevm-remote-fuzz-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const repo = join(root, 'tevm')
	const bin = join(root, 'bin')
	const remote = join(root, "staging with 'quotes'")
	for (const name of ['tevm/scripts/fuzz', 'zevm', 'voltaire', 'guillotine-mini', 'bin'])
		mkdirSync(join(root, name), { recursive: true })
	for (const file of ['run-zig-fuzz-remote.mjs', 'run-zig-fuzz-linux.sh'])
		cpSync(new URL(file, import.meta.url), join(repo, 'scripts/fuzz', file))
	writeFileSync(join(repo, 'mise.toml'), 'zig = "fixture"\n')
	const env = {
		...process.env,
		PATH: `${bin}:${process.env.PATH}`,
		TEVM_ZIG_FUZZ_FORCE_REMOTE: '1',
		TEVM_ZIG_FUZZ_DIR: remote,
		TEVM_ZIG_FUZZ_HOST: '',
		LOG: join(root, 'log'),
	}
	const script = join(repo, 'scripts/fuzz/run-zig-fuzz-remote.mjs')
	assert.match(spawnSync(process.execPath, [script], { env, encoding: 'utf8' }).stderr, /Set TEVM_ZIG_FUZZ_HOST/)

	// The ssh stand-in passes the command through a shell just as ssh does.
	// Substitute an argument recorder for the remote runner and keep all I/O local.
	writeFileSync(
		join(bin, 'ssh'),
		`#!/bin/sh
for command do :; done
case "$command" in
  "'bash' "*) command="'record' \${command#* }" ;;
esac
exec /bin/sh -c "$command"
`,
		{ mode: 0o755 },
	)
	for (const tool of ['record', 'rsync'])
		writeFileSync(
			join(bin, tool),
			`#!/usr/bin/env node
require('node:fs').appendFileSync(process.env.LOG, JSON.stringify([${JSON.stringify(tool)}, ...process.argv.slice(2)]) + '\\n')
`,
			{ mode: 0o755 },
		)
	env.TEVM_ZIG_FUZZ_HOST = 'fixture-host'
	env.TEVM_ZIG_FUZZ_FILTER = "a 'quoted' filter with spaces & a dollar sign $"
	for (let i = 0; i < 2; i++) execFileSync(process.execPath, [script], { env })
	const calls = readFileSync(env.LOG, 'utf8').trim().split('\n').map(JSON.parse)
	const runners = calls.filter(([name]) => name === 'record')
	assert.equal(runners.length, 2)
	assert.notEqual(runners[0][3], runners[1][3])
	for (const [, , , dir, target, pin, , filter] of runners) {
		assert.ok(dir.startsWith(remote + '/tevm-zig-fuzz.'))
		assert.equal(target, 'zevm')
		assert.equal(pin, 'fixture')
		assert.equal(filter, env.TEVM_ZIG_FUZZ_FILTER)
	}
	const transfers = calls.filter(([name]) => name === 'rsync')
	assert.equal(transfers.length, 6)
	for (const transfer of transfers) assert.ok(transfer.includes('--exclude=.env*'))
	assert.deepEqual(readdirSync(remote), [])
})

test('the timed Linux runner waits for an executed input and propagates failed builds', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'tevm-zig-budget-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	mkdirSync(join(root, 'zevm'))
	const env = { ...process.env, PATH: `${root}:${process.env.PATH}`, STEPS: join(root, 'steps') }
	writeFileSync(
		join(root, 'zig'),
		`#!/bin/sh
if [ "$1" = version ]; then echo fixture; exit 0; fi
echo "$*" >> "$STEPS"
if [ "$TEST_BUILD_FAIL" = 1 ]; then exit 17; fi
if [ "$6" = --fuzz ]; then
  sleep 2
  mkdir -p "$4/v"
  printf '\\001\\000\\000\\000\\000\\000\\000\\000' > "$4/v/map"
  exec sleep 30
fi
`,
		{ mode: 0o755 },
	)
	const args = [join(import.meta.dirname, 'run-zig-fuzz-linux.sh'), root, 'zevm', 'fixture', 'fuzz', 'test filter', '1']
	const options = { env, encoding: 'utf8', timeout: 12_000 }
	const start = Date.now()
	assert.match(execFileSync('bash', args, options), /Observed a fuzz execution/)
	assert.ok(Date.now() - start >= 2900)
	assert.equal(readFileSync(env.STEPS, 'utf8').trim().split('\n').length, 2)
	assert.equal(spawnSync('bash', args, { ...options, env: { ...env, TEST_BUILD_FAIL: '1' } }).status, 17)
})
