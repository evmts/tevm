/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('packages/consensus')

// Reduced script set. This package declares only build, typecheck, and
// test:run scripts, so the exemplar's lint, format, clean, docs, depsLint,
// pack, packageLint, apiCompat, and coverage targets are absent.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const vitestConfig = S.file('vitest.config.ts')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types. tsup-only dts emit; the script has no tsc half, so there is no
// declarations target.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// typecheck. The tsconfig excludes the spec files, so tests are not key
// material here.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

// test:run. There is no test:coverage script and the config declares no
// thresholds, so no coverage target or gate.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

const check = S.Suite({
	tests: [typecheck, test],
})

// Not targets: `build` is the nx aggregate the build and types targets
// replace.
export const Package = S.Package({
	targets: {
		build,
		check,
		srcs,
		test,
		tests,
		typecheck,
		types,
	},
})
