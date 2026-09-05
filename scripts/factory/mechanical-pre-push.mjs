#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

// Sibling source edits are outside Flows' file boundary. Let Zig inspect them
// before the uncached Nx lanes instead of replaying a native build receipt.
const native = spawnSync(process.execPath, ['scripts/factory/build-native.mjs'], { stdio: 'inherit' })
if (native.error) throw native.error
if (native.status !== 0) process.exit(native.status ?? 1)

const common = ['--parallel=2', '--skip-nx-cache']
const lanes = [
	{
		name: 'static analysis',
		args: ['exec', 'nx', 'run-many', '--targets=lint:check,typecheck', ...common],
	},
	{
		name: 'hermetic tests',
		args: [
			'exec',
			'nx',
			'run-many',
			'--target=test:run',
			'--exclude=@tevm/compiler,@tevm/viem,@tevm/mcp,@tevm/cli',
			...common,
		],
	},
]

for (const lane of lanes) {
	console.log(`factory mechanical lane: ${lane.name}`)
	const result = spawnSync('pnpm', lane.args, { env: process.env, stdio: 'inherit' })
	if (result.error) throw result.error
	if (result.status !== 0) {
		process.exitCode = result.status ?? 1
		break
	}
}
