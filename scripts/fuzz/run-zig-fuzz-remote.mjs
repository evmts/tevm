#!/usr/bin/env node
// Zig coverage-guided fuzzing requires Linux. Other hosts stage the three sibling
// checkouts on the explicitly selected SSH host and run the same Linux runner.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = resolve(import.meta.dirname, '../..')
const siblings = resolve(repo, '..')
const repos = ['zevm', 'voltaire', 'guillotine-mini']
const target = process.env.TEVM_ZIG_FUZZ_REPO ?? 'zevm'
const duration = process.env.TEVM_ZIG_FUZZ_SECONDS ?? '15'
const host = process.env.TEVM_ZIG_FUZZ_HOST
const remote = process.platform !== 'linux' || Boolean(process.env.TEVM_ZIG_FUZZ_FORCE_REMOTE)
if (remote && !host) throw new Error('Set TEVM_ZIG_FUZZ_HOST to the Linux SSH host for remote fuzzing')
if (remote && !/^(?:[a-zA-Z0-9_][a-zA-Z0-9_.-]*@)?(?:[a-zA-Z0-9_][a-zA-Z0-9_.-]*|\[[a-fA-F0-9:]+\])$/.test(host))
	throw new Error('Invalid TEVM_ZIG_FUZZ_HOST')
if (!repos.includes(target)) throw new Error('Invalid TEVM_ZIG_FUZZ_REPO')
if (!/^[1-9][0-9]*$/.test(duration) || !Number.isSafeInteger(Number(duration)))
	throw new Error('Invalid TEVM_ZIG_FUZZ_SECONDS')
const step = process.env.TEVM_ZIG_FUZZ_STEP ?? ''
if (step && !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(step)) throw new Error('Invalid TEVM_ZIG_FUZZ_STEP')
const [, zigVersion] = /^zig\s*=\s*"([^"]+)"/m.exec(readFileSync(resolve(repo, 'mise.toml'), 'utf8'))
const runner = readFileSync(new URL('./run-zig-fuzz-linux.sh', import.meta.url), 'utf8')
const args = [target, zigVersion, step, process.env.TEVM_ZIG_FUZZ_FILTER ?? '', duration]
const run = (bin, args, options) => execFileSync(bin, args, { stdio: 'inherit', ...options })
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const sshArgs = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', '--', host]
const input = { input: runner, stdio: ['pipe', 'inherit', 'inherit'] }

if (!remote) {
	run('bash', ['-s', '--', siblings, ...args], input)
} else {
	for (const name of repos) {
		if (!existsSync(resolve(siblings, name))) throw new Error(`Missing sibling repository: ${name}`)
	}
	const base = process.env.TEVM_ZIG_FUZZ_DIR ?? '/tmp'
	if (!base.startsWith('/') || /[\r\n]/.test(base))
		throw new Error('TEVM_ZIG_FUZZ_DIR must be an absolute single-line path')
	const template = resolve(base, 'tevm-zig-fuzz.XXXXXXXX')
	const dir = run('ssh', [...sshArgs, `mkdir -p -- ${quote(base)} && mktemp -d -- ${quote(template)}`], {
		stdio: ['ignore', 'pipe', 'inherit'],
		encoding: 'utf8',
	}).trimEnd()
	if (!dir.startsWith(template.slice(0, -8)) || !/^[a-zA-Z0-9]{8}$/.test(dir.slice(template.length - 8))) {
		throw new Error('Unexpected remote mktemp result')
	}
	try {
		for (const name of repos) {
			run('rsync', [
				'-az',
				'--exclude=.env*',
				'--exclude=.git',
				'--exclude=.jj',
				'--exclude=.zig-cache',
				'--exclude=.zig-cache-*',
				'--exclude=zig-out',
				'--exclude=node_modules',
				'--exclude=target',
				'--exclude=artifacts',
				'--exclude=.smithers',
				'--exclude=.worktrees',
				'--exclude=.playwright-mcp',
				'--exclude=smithers.db*',
				'--exclude=tevm-monorepo',
				'--exclude=docs',
				'--exclude=docs-starlight',
				'--exclude=apps',
				'--exclude=benchmark',
				'--exclude=coverage',
				'--exclude=kotlin',
				'--exclude=reports',
				'--exclude=examples',
				'--exclude=client-ts',
				'--exclude=cloudflare',
				'--exclude=wasm',
				'--exclude=workflow',
				'--exclude=*.log',
				`--rsync-path=cd ${quote(dir)} && rsync`,
				'--',
				`${resolve(siblings, name)}/`,
				`${host}:./${name}/`,
			])
		}
		run('ssh', [...sshArgs, ['bash', '-s', '--', dir, ...args].map(quote).join(' ')], input)
	} finally {
		run('ssh', [...sshArgs, `rm -rf -- ${quote(dir)}`])
	}
}
