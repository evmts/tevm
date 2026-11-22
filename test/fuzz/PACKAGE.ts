/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'
import { Package as root } from '../../PACKAGE.js'

const Shell = scopedShell('test/fuzz')

const sources = S.Filegroup({
	srcs: S.glob([
		'package.json',
		'tsconfig.json',
		'vitest.config.ts',
		'src/**',
		'jazzer/**',
		'scripts/**',
		'__fuzz__/**',
	]),
})

const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [sources, root.allBuilds],
	sandbox: { network: 'loopback' },
})

const effectFuzz = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/effect-feedback.fuzz.spec.ts'],
	env: { TEVM_FUZZ_MODE: 'campaign', TEVM_FUZZ_EFFECT_EXECUTIONS: '5000' },
	data: [sources, root.allBuilds],
	sandbox: { network: 'loopback' },
})

const jazzer = Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/run-jazzer.mjs'],
	env: { JAZZER_SECONDS: '5' },
	data: [sources, root.allBuilds],
	sandbox: { network: 'loopback' },
})

const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [sources, root.allTypes],
})

const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.'],
	data: [sources, S.file('//biome.json')],
})

const all = S.Suite({
	tests: [test, effectFuzz, jazzer, typecheck, lint],
})

export const Package = S.Package({
	targets: {
		all,
		effectFuzz,
		jazzer,
		lint,
		test,
		typecheck,
	},
})
