#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const pins = JSON.parse(readFileSync(resolve(root, 'factory/native-dependencies.json'), 'utf8'))
for (const name of ['voltaire', 'guillotine-mini', 'zevm']) {
	const revision = pins[name]
	if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error(`Invalid ${name} revision`)
	const cwd = resolve(root, '..', name)
	const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
	if (!existsSync(cwd)) {
		execFileSync('git', ['init', cwd], { stdio: 'inherit' })
		git('remote', 'add', 'origin', `https://github.com/evmts/${name}.git`)
		git('fetch', '--depth', '1', 'origin', revision)
		git('checkout', '--detach', 'FETCH_HEAD')
		git('submodule', 'update', '--init', '--recursive')
	}
	if (git('rev-parse', 'HEAD') !== revision)
		throw new Error(`${name} does not match its release pin; checkout preserved`)
	console.log(`${name} ready at ${revision}`)
}
