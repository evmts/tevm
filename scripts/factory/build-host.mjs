#!/usr/bin/env node
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, repositoryRoot } from './lib.mjs'

// Bootstrap the native host without requiring an already-built workspace graph.
// Keep dependency order explicit, including dependencies used by declarations.
const packages = [
	'configs/tsupconfig',
	'packages/errors',
	'packages/utils',
	'packages/common',
	'packages/jsonrpc',
	'packages/contract',
	'packages/node',
	'packages/actions',
	'packages/memory-client',
	'packages/server',
	'extensions/viem',
	'extensions/ethers',
	'packages/http-client',
	'packages/predeploys',
	'packages/mcp',
]

for (const path of packages) {
	const cwd = resolve(repositoryRoot, path)
	console.log(`Building ${path}`)
	// tsc and the shared tsup config retain removed files unless cleaned first.
	await rm(resolve(cwd, 'dist'), { recursive: true, force: true })
	await rm(resolve(cwd, 'types'), { recursive: true, force: true })
	command('pnpm', ['exec', 'tsup'], { cwd, stdio: 'inherit' })
	command('pnpm', ['exec', 'tsup', '--dts-only'], { cwd, stdio: 'inherit' })
	command('pnpm', ['exec', 'tsc', '--emitDeclarationOnly', '--declaration'], { cwd, stdio: 'inherit' })
}
