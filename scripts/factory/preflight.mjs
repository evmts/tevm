#!/usr/bin/env node
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
probe('bun', 'bun', ['--version'], undefined, requireFull)
probe('cargo', 'cargo', ['--version'], undefined, requireFull)
probe('forge', 'forge', ['--version'], undefined, requireFull)

for (const name of ['TEVM_TEST_ALCHEMY_KEY', 'TEVM_RPC_URLS_MAINNET', 'TEVM_RPC_URLS_OPTIMISM']) {
	add(`${name} integration secret`, Boolean(process.env[name]), process.env[name] ? 'set' : 'not set', requireFull)
}

const checkoutProbe = async (name, declaration, required) => {
	const path = resolve(repositoryRoot, declaration.localPath)
	try {
		await access(resolve(path, '.git'))
		const head = command('git', ['-C', path, 'rev-parse', 'HEAD'])
		const dirty = command('git', ['-C', path, 'status', '--short'])
		add(name, head === declaration.revision, `${head}${dirty ? ' (dirty checkout)' : ''}`, required)
	} catch (error) {
		add(name, false, error instanceof Error ? error.message : String(error), required)
	}
}

await checkoutProbe('local Flows checkout', policy.toolchain.flows, true)
await checkoutProbe('Zevm checkout', policy.toolchain.zevm, requireFull)

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
