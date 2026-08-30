#!/usr/bin/env node
// Builds the vendored Flows source the @smthrs/* link: dependencies resolve
// through. vendor/flows is a gitlink at the revision factory/policy.json
// records; its packages export dist/esm, which the checkout does not carry,
// so the build must run once per pinned revision on every host, including
// a CI runner. package.json runs this as postinstall so `pnpm install`
// leaves the CLI runnable; a stamp under the (gitignored) dist directory
// keeps the second run free.
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { command, readPolicy, repositoryRoot } from './lib.mjs'

const policy = await readPolicy()
const flowsRoot = resolve(repositoryRoot, policy.toolchain.flows.localPath)
const cliRoot = resolve(flowsRoot, 'packages/build-cli')
const stampPath = resolve(cliRoot, 'dist/.tevm-flows-build')
const entry = resolve(flowsRoot, 'packages/targets/dist/esm/index.js')

const exists = async (path) => {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

if (!(await exists(resolve(flowsRoot, 'package.json')))) {
	throw new Error(
		`${flowsRoot} is not checked out; run \`git submodule update --init --recursive -- ${policy.toolchain.flows.localPath}\``,
	)
}

const head = command('git', ['-C', flowsRoot, 'rev-parse', 'HEAD'])
const stamp = (await exists(stampPath)) ? (await readFile(stampPath, 'utf8')).trim() : ''
if (stamp === head && (await exists(entry))) {
	console.log(`Vendored Flows already built at ${head.slice(0, 12)}`)
} else {
	// The nested install must not inherit this install's npm_config_* view of
	// the world (frozen-lockfile, filters, production flags) nor the outer
	// pnpm's lifecycle markers, so only the ambient shell environment passes.
	const env = Object.fromEntries(
		Object.entries(process.env).filter(
			([name]) => !name.startsWith('npm_') && !name.startsWith('PNPM_') && name !== 'INIT_CWD' && name !== 'NODE_ENV',
		),
	)
	console.log(`Building vendored Flows at ${head.slice(0, 12)}`)
	command('pnpm', ['install', '--frozen-lockfile'], { cwd: flowsRoot, env, stdio: 'inherit' })
	// build-cli runs from src; every package it imports resolves through
	// dist/esm, so the dependency closure builds in topological order.
	command('pnpm', ['--recursive', '--filter', '@smthrs/build-cli^...', 'exec', 'tsc', '-b', 'tsconfig.json'], {
		cwd: flowsRoot,
		env,
		stdio: 'inherit',
	})
	if (!(await exists(entry))) throw new Error(`Flows build did not produce ${entry}`)
	// build-cli itself runs from src, so its dist directory exists only for
	// this stamp; the directory is gitignored in Flows like every dist.
	await mkdir(dirname(stampPath), { recursive: true })
	await writeFile(stampPath, `${head}\n`, 'utf8')
	console.log(`Vendored Flows built at ${head.slice(0, 12)}`)
}
