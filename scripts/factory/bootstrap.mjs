#!/usr/bin/env node
import { access, realpath } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, parseArgs, pathWithoutNodeModuleBins, readPolicy, repositoryRoot } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const install = args.has('install')
const policy = await readPolicy()

const exists = async (path) => {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

// The repository index is the version authority: a vendored checkout is a
// gitlink, and policy.json records the same SHA so the factory can name it
// without a git call. Both must agree, and the worktree must sit at it.
const gitlinkOf = (path) => {
	const raw = command('git', ['ls-files', '--stage', '--', path])
	const match = /^160000 ([0-9a-f]{40}) 0\t/.exec(raw)
	if (!match) throw new Error(`${path} is not a gitlink in the repository index`)
	return match[1]
}

const ensureSubmodule = async (name, declaration) => {
	const path = resolve(repositoryRoot, declaration.localPath)
	const gitlink = gitlinkOf(declaration.localPath)
	if (gitlink !== declaration.revision) {
		throw new Error(
			`${name} gitlink ${gitlink} disagrees with factory/policy.json revision ${declaration.revision}; move both together`,
		)
	}
	if (!(await exists(resolve(path, '.git')))) {
		if (!install) throw new Error(`${name} is not checked out at ${path}; rerun with --install`)
		command('git', ['submodule', 'update', '--init', '--recursive', '--', declaration.localPath], { stdio: 'inherit' })
	}
	const head = command('git', ['-C', path, 'rev-parse', 'HEAD'])
	if (head !== declaration.revision) {
		throw new Error(
			`${name} is at ${head}, expected ${declaration.revision}. ` +
				`The bootstrapper never rewrites an existing checkout; run \`git submodule update -- ${declaration.localPath}\` yourself.`,
		)
	}
	console.log(`${name}: ${declaration.localPath} @ ${head.slice(0, 12)}`)
}

await ensureSubmodule('Flows', policy.toolchain.flows)
for (const sibling of ['zevm', 'voltaire', 'guillotine-mini']) {
	if (!(await exists(resolve(repositoryRoot, '..', sibling, 'build.zig')))) {
		throw new Error(`Missing ../${sibling} checkout; native development requires all three sibling repositories`)
	}
}

// mise is how the pinned bun and foundry releases reach both the executor
// and CI. The bootstrapper installs the pins so the first target does not
// pay for it, but it does not install mise itself.
try {
	command('mise', ['--version'])
} catch {
	throw new Error('mise is not on PATH; install it (brew install mise, or https://mise.jdx.dev) and rerun')
}
if (install) command('mise', ['install'], { stdio: 'inherit', env: { ...process.env, MISE_YES: '1' } })

if (install) {
	// postinstall builds vendor/flows, so the CLI is runnable after this.
	command('pnpm', ['install', '--frozen-lockfile'], { cwd: repositoryRoot, stdio: 'inherit' })
	const flowsRoot = await realpath(resolve(repositoryRoot, policy.toolchain.flows.localPath))
	const expectedCliRoot = resolve(flowsRoot, 'packages/build-cli')
	const resolveGlobalCli = async () => {
		try {
			return await realpath(
				command('which', ['smthrs'], { env: { ...process.env, PATH: pathWithoutNodeModuleBins() } }),
			)
		} catch {
			return undefined
		}
	}
	let globalCli = await resolveGlobalCli()
	if (!globalCli?.startsWith(`${expectedCliRoot}/`)) {
		command('npm', ['link'], { cwd: expectedCliRoot, stdio: 'inherit' })
		globalCli = await resolveGlobalCli()
	}
	if (!globalCli?.startsWith(`${expectedCliRoot}/`)) {
		throw new Error(`global smthrs must resolve inside ${expectedCliRoot}; got ${globalCli ?? 'not found'}`)
	}
	command('pnpm', ['exec', 'smthrs', 'gitHooks', '--write'], { cwd: repositoryRoot, stdio: 'inherit' })
	console.log(`Git hooks use vendored Flows CLI: ${globalCli}`)
}

console.log(install ? 'Factory dependencies installed.' : 'Factory vendored checkouts are present.')
