#!/usr/bin/env node
// Builds the vendored sources an installed workspace cannot use unbuilt:
// vendor/flows, which the @smthrs/* link: dependencies resolve through and
// whose packages export dist/esm, and vendor/zevm's npm package, whose dist
// every @tevm package imports. Both are gitlinks at the revisions
// factory/policy.json records; a checkout carries neither build, so it runs
// once per pinned revision on every host, including a CI runner.
// package.json runs this as postinstall so `pnpm install` leaves the CLI
// runnable and the workspace resolvable; stamps under the (gitignored) dist
// directories keep the second run free. //:zevm remains the graph's own
// declaration of the zevm build for targets that key on it.
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { command, readPolicy, repositoryRoot } from './lib.mjs'

const policy = await readPolicy()
const flowsRoot = resolve(repositoryRoot, policy.toolchain.flows.localPath)
const cliRoot = resolve(flowsRoot, 'packages/build-cli')
const stampPath = resolve(cliRoot, 'dist/.tevm-flows-build')
const entry = resolve(flowsRoot, 'packages/targets/dist/esm/index.js')

// A nested pnpm must not inherit this install's npm_config_* view of the
// world (frozen-lockfile, filters, production flags) nor the outer pnpm's
// lifecycle markers, so only the ambient shell environment passes.
const env = Object.fromEntries(
	Object.entries(process.env).filter(
		([name]) => !name.startsWith('npm_') && !name.startsWith('PNPM_') && name !== 'INIT_CWD' && name !== 'NODE_ENV',
	),
)

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

// @evmts/zevm: the same idempotent build //:zevm declares, keyed on the
// gitlink so a moved pin rebuilds and an unchanged one costs nothing.
const zevmRoot = resolve(repositoryRoot, policy.toolchain.zevm.localPath)
const zevmPackage = resolve(zevmRoot, 'npm/zevm')
const zevmStamp = resolve(zevmPackage, 'dist/.tevm-vendored-build')
const zevmEntry = resolve(zevmPackage, 'dist/index.js')
if (!(await exists(resolve(zevmPackage, 'package.json')))) {
	throw new Error(
		`${zevmPackage} is not checked out; run \`git submodule update --init -- ${policy.toolchain.zevm.localPath}\``,
	)
}
const zevmHead = command('git', ['-C', zevmRoot, 'rev-parse', 'HEAD'])
const zevmStamped = (await exists(zevmStamp)) ? (await readFile(zevmStamp, 'utf8')).trim() : ''
if (zevmStamped === zevmHead && (await exists(zevmEntry))) {
	console.log(`Vendored zevm already built at ${zevmHead.slice(0, 12)}`)
} else {
	console.log(`Building vendored zevm at ${zevmHead.slice(0, 12)}`)
	command('pnpm', ['--filter', '@evmts/zevm', 'build'], { cwd: repositoryRoot, env, stdio: 'inherit' })
	if (!(await exists(zevmEntry))) throw new Error(`zevm build did not produce ${zevmEntry}`)
	await mkdir(dirname(zevmStamp), { recursive: true })
	await writeFile(zevmStamp, `${zevmHead}\n`, 'utf8')
	console.log(`Vendored zevm built at ${zevmHead.slice(0, 12)}`)
}
