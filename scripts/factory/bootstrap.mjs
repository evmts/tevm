#!/usr/bin/env node
import { access, mkdir, realpath } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
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

const ensureCheckout = async (name, declaration) => {
	const path = resolve(repositoryRoot, declaration.localPath)
	if (!(await exists(resolve(path, '.git')))) {
		if (!install) throw new Error(`${name} is missing at ${path}; rerun with --install`)
		await mkdir(dirname(path), { recursive: true })
		command('git', ['clone', '--filter=blob:none', declaration.repository, path], { stdio: 'inherit' })
		command('git', ['-C', path, 'checkout', '--detach', declaration.revision], { stdio: 'inherit' })
	}
	const head = command('git', ['-C', path, 'rev-parse', 'HEAD'])
	if (head !== declaration.revision) {
		throw new Error(
			`${name} is at ${head}, expected ${declaration.revision}. ` +
				'The bootstrapper never rewrites an existing checkout; reconcile it manually.',
		)
	}
	console.log(`${name}: ${path} @ ${head.slice(0, 12)}`)
}

await ensureCheckout('Flows', policy.toolchain.flows)
await ensureCheckout('Zevm', policy.toolchain.zevm)

if (install) {
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
	console.log(`Git hooks use local Flows CLI: ${globalCli}`)
}

console.log(install ? 'Factory dependencies installed.' : 'Factory sibling checkouts are present.')
