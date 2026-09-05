#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const target = process.argv[2]
if (!target || !/^(specs(?:-[a-z0-9-]+)?|test-trace)$/.test(target) || process.argv.length !== 3) {
	throw new Error('Usage: node scripts/native-conformance.mjs <guillotine-mini specs target or test-trace>')
}
const cwd = fileURLToPath(new URL('../../guillotine-mini/', import.meta.url))
const result = spawnSync('zig', ['build', target], { cwd, stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
