#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { access, readFile, realpath } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, option, parseArgs, pathWithoutNodeModuleBins, readJson, readPolicy, repositoryRoot } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const mode = option(args, 'mode', 'core')
const format = option(args, 'format', 'markdown')
if (!['core', 'full', 'github'].includes(mode)) throw new Error(`Unknown preflight mode: ${mode}`)

const policy = await readPolicy()
const packageJson = await readJson(resolve(repositoryRoot, 'package.json'))
const checks = []
const add = (name, ok, detail, required = true) => checks.push({ name, ok, detail, required })

const probe = (name, executable, versionArgs, expected, required = true) => {
	try {
		const output = command(executable, versionArgs).split('\n')[0]
		add(name, expected === undefined || output.includes(expected), output, required)
	} catch (error) {
		add(name, false, error instanceof Error ? error.message : String(error), required)
	}
}

probe('node', 'node', ['--version'], `v${policy.toolchain.node.split('.')[0]}.`)
probe('pnpm', 'pnpm', ['--version'], policy.toolchain.pnpm)
probe('git', 'git', ['--version'])
probe('codex', 'codex', ['--version'], policy.toolchain.codexCli)

const requireFull = mode === 'full'
const requireGithub = mode === 'github' || requireFull
probe('gh', 'gh', ['--version'], undefined, requireGithub)
probe('cargo', 'cargo', ['--version'], undefined, requireFull)

// bun and forge are mise pins, not host binaries: the check resolves each
// through the declared config so a stray host copy cannot pass for the pin.
probe('mise', 'mise', ['--version'])
const misePin = (tool) => {
	const config = readFileSync(resolve(repositoryRoot, 'mise.toml'), 'utf8')
	return new RegExp(`^${tool}\\s*=\\s*"([^"]+)"`, 'm').exec(config)?.[1]
}
for (const [tool, executable] of [
	['bun', 'bun'],
	['foundry', 'forge'],
]) {
	const pinned = misePin(tool)
	try {
		const path = command('mise', ['which', executable], { env: { ...process.env, MISE_YES: '1' } })
		const output = command(path, ['--version']).split('\n')[0]
		add(`${executable} (mise ${tool} ${pinned ?? 'unpinned'})`, pinned !== undefined && output.includes(pinned), output)
	} catch (error) {
		add(
			`${executable} (mise ${tool} ${pinned ?? 'unpinned'})`,
			false,
			error instanceof Error ? error.message : String(error),
		)
	}
}

for (const name of ['TEVM_TEST_ALCHEMY_KEY', 'TEVM_RPC_URLS_MAINNET', 'TEVM_RPC_URLS_OPTIMISM']) {
	add(`${name} integration secret`, Boolean(process.env[name]), process.env[name] ? 'set' : 'not set', requireFull)
}

// The conformance and parity runners read upstream corpora an operator
// materializes; without them //test:conformanceAll and //test:parityFast
// stop at "No upstream fixture corpus configured". Reported, never required.
for (const [name, fallback] of [
	['TEVM_GENERAL_STATE_TESTS_FIXTURES', '.cache/conformance-corpus/ethereum-tests/GeneralStateTests'],
	['TEVM_EXECUTION_SPEC_TESTS_FIXTURES', '.cache/conformance-corpus/execution-spec-tests/fixtures/state_tests'],
]) {
	const value = process.env[name] ?? resolve(repositoryRoot, fallback)
	let present = false
	try {
		await access(value)
		present = true
	} catch {}
	add(`${name} fixture corpus`, present, present ? value : `${value} missing (run //test:conformanceCorpus)`, false)
}

// A vendored checkout passes only when the index gitlink, the policy
// revision, and the worktree HEAD agree, and the worktree is clean:
// //:vendor refuses anything else, so preflight says so first.
const checkoutProbe = async (name, declaration, required) => {
	const path = resolve(repositoryRoot, declaration.localPath)
	try {
		const raw = command('git', ['ls-files', '--stage', '--', declaration.localPath])
		const gitlink = /^160000 ([0-9a-f]{40}) 0\t/.exec(raw)?.[1]
		if (gitlink !== declaration.revision) {
			add(name, false, `gitlink ${gitlink ?? 'missing'} disagrees with policy ${declaration.revision}`, required)
			return
		}
		await access(resolve(path, '.git'))
		const head = command('git', ['-C', path, 'rev-parse', 'HEAD'])
		const dirty = command('git', ['-C', path, 'status', '--porcelain', '--untracked-files=all'])
		add(name, head === declaration.revision && !dirty, `${head}${dirty ? ' (dirty checkout)' : ''}`, required)
	} catch (error) {
		add(name, false, error instanceof Error ? error.message : String(error), required)
	}
}

await checkoutProbe('vendor/flows submodule', policy.toolchain.flows, true)
for (const sibling of ['zevm', 'voltaire', 'guillotine-mini']) {
	const path = resolve(repositoryRoot, '..', sibling, 'build.zig')
	try {
		await access(path)
		add(`${sibling} native source`, true, path, requireFull)
	} catch {
		add(`${sibling} native source`, false, `missing ${path}`, requireFull)
	}
}

try {
	const executable = await realpath(
		command('which', ['smthrs'], { env: { ...process.env, PATH: pathWithoutNodeModuleBins() } }),
	)
	const expectedRoot = await realpath(resolve(repositoryRoot, policy.toolchain.flows.localPath, 'packages/build-cli'))
	add('git-hook smthrs CLI', executable.startsWith(`${expectedRoot}/`), executable)
} catch (error) {
	add('git-hook smthrs CLI', false, error instanceof Error ? error.message : String(error))
}

for (const packageName of ['build-cli', 'targets']) {
	try {
		const installed = await realpath(resolve(repositoryRoot, `node_modules/@smthrs/${packageName}`))
		const expectedRoot = await realpath(resolve(repositoryRoot, policy.toolchain.flows.localPath))
		add(`local @smthrs/${packageName}`, installed.startsWith(`${expectedRoot}/`), installed)
	} catch (error) {
		add(`local @smthrs/${packageName}`, false, error instanceof Error ? error.message : String(error))
	}
}

const nvmrc = (await readFile(resolve(repositoryRoot, '.nvmrc'), 'utf8')).trim()
add('.nvmrc policy', nvmrc === policy.toolchain.node, nvmrc)
add('packageManager policy', packageJson.packageManager === `pnpm@${policy.toolchain.pnpm}`, packageJson.packageManager)

if (requireGithub) {
	try {
		command('gh', ['auth', 'status'])
		add('GitHub authentication', true, 'authenticated')
	} catch {
		add('GitHub authentication', false, 'run gh auth login')
	}
}

const failures = checks.filter((check) => check.required && !check.ok)
const result = { schemaVersion: 1, mode, ok: failures.length === 0, checks }

if (format === 'json') {
	console.log(JSON.stringify(result, null, 2))
} else if (format === 'markdown') {
	console.log(`## TEVM factory preflight (${mode})\n`)
	for (const check of checks) {
		console.log(`- ${check.ok ? 'PASS' : check.required ? 'FAIL' : 'SKIP'} ${check.name}: ${check.detail}`)
	}
} else {
	throw new Error(`Unsupported --format ${format}`)
}

if (!result.ok) process.exitCode = 1
