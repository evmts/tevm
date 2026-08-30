#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { assert, repositoryRoot } from './lib.mjs'

const workspaceRoot = await realpath(await mkdtemp(join(tmpdir(), 'tevm-factory-agent-smoke-')))

const write = async (relative, contents) => {
	const path = resolve(workspaceRoot, relative)
	await mkdir(dirname(path), { recursive: true })
	await writeFile(path, contents)
}

const exists = async (path) =>
	access(path).then(
		() => true,
		() => false,
	)

const runProcess = (executable, args, options = {}) => {
	const result = spawnSync(executable, args, {
		cwd: options.cwd ?? repositoryRoot,
		encoding: 'utf8',
		env: options.env ?? process.env,
	})
	assert(result.status === 0, result.stderr || result.stdout || `${executable} exited ${result.status}`)
	return result
}

const git = (...args) => runProcess('git', ['-C', workspaceRoot, ...args])

const runAgent = async (name, edits, expectSuccess) => {
	const nonce = `${name}-${process.pid}-${Date.now()}`
	const scriptPath = resolve(workspaceRoot, 'fake.json')
	const logPath = `${scriptPath}.spawns.jsonl`
	await rm(logPath, { force: true })
	await writeFile(
		scriptPath,
		JSON.stringify({
			identity: `tevm-factory-${nonce}`,
			responses: [{ purpose: 'diff', edits }],
		}),
	)
	const result = spawnSync(
		'pnpm',
		[
			'--silent',
			'exec',
			'smthrs',
			'target',
			'//:agentRuntime',
			'--workspace',
			workspaceRoot,
			'--input',
			`nonce=${nonce}`,
			'--no-cache',
			'--format',
			'json',
		],
		{
			cwd: repositoryRoot,
			encoding: 'utf8',
			env: { ...process.env, SMTHRS_AGENT_FAKE: scriptPath },
		},
	)
	if (expectSuccess) {
		assert(result.status === 0, result.stderr || `agent smoke exited ${result.status}`)
		assert(JSON.parse(result.stdout).ok === true, 'agent smoke report was not green')
	} else {
		assert(result.status !== 0, 'write-set escape unexpectedly succeeded')
		assert(result.stderr.includes('outside the declared write-set'), 'write-set escape failed for the wrong reason')
	}
	const spawns = (await readFile(logPath, 'utf8')).trim().split('\n')
	assert(spawns.length === 1, `${name} smoke expected one agent spawn, got ${spawns.length}`)
}

try {
	await write(
		'WORKSPACE.ts',
		`import { Smithers as S } from '@smthrs/targets'
const packageJson = S.file('//package.json')
export const Workspace = S.Workspace('factory-smoke', {
  repository: 'git+https://example.invalid/factory-smoke.git',
  cache: S.Cache({ directory: '.flows' }),
  runtime: S.Runtime.Node({ version: '24' }),
  packageManager: S.PackageManager.Yarn({ manifest: packageJson, lockfile: S.file('//yarn.lock') }),
  nodeModules: S.Npm.NodeModules({ packageJson }),
  agents: S.Agents({ default: S.Agent.Codex({ model: 'fake' }) }),
})
`,
	)
	await write(
		'PACKAGE.ts',
		`import { Smithers as S } from '@smthrs/targets'
const srcs = S.Filegroup({ srcs: S.glob(['src/**']) })
const gate = S.Shell.Test({ command: 'test -f out/generated.txt' })
const agentRuntime = S.Agent.Diff({
  agent: S.Agents.default,
  prompt: S.file('//prompt.md'),
  payload: { nonce: S.Input.String('unique smoke nonce') },
  data: [srcs],
  changes: ['out/**'],
  gates: [gate],
  maxRounds: 1,
})
export const Package = S.Package({ targets: { agentRuntime, gate, srcs } })
`,
	)
	await write('package.json', '{"name":"factory-smoke","private":true}\n')
	await write('yarn.lock', '')
	await write('prompt.md', 'Create the declared generated file.\n')
	await write('src/input.txt', 'input\n')
	await write('.gitignore', 'node_modules\n.flows\nfake.json*\n')
	await symlink(resolve(repositoryRoot, 'node_modules'), resolve(workspaceRoot, 'node_modules'), 'dir')

	git('init', '-q')
	git('config', 'user.email', 'factory-smoke@example.invalid')
	git('config', 'user.name', 'TEVM factory smoke')
	git('config', 'commit.gpgsign', 'false')
	git('add', '-A')
	git('commit', '-qm', 'initial smoke fixture')

	await runAgent('accepted', [{ path: 'out/generated.txt', contents: 'generated\n' }], true)
	assert(
		(await readFile(resolve(workspaceRoot, 'out/generated.txt'), 'utf8')) === 'generated\n',
		'candidate was not applied',
	)
	git('add', '-A')
	git('commit', '-qm', 'accepted candidate')

	await runAgent('escape', [{ path: 'outside.txt', contents: 'not allowed\n' }], false)
	assert(!(await exists(resolve(workspaceRoot, 'outside.txt'))), 'escaped edit reached disk')
	console.log('factory agent runtime smoke ok: candidate accepted, gate ran, write-set escape rejected')
} finally {
	await rm(workspaceRoot, { recursive: true, force: true })
}
