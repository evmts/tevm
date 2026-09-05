/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('packages/mcp')

// Follows the packages/contract/PACKAGE.ts exemplar with a reduced script set: no
// lint:deps, lint:package, or clean scripts, so the depsLint, pack,
// packageLint, apiCompat, and clean targets are absent. fork.spec.ts forks a
// live network, so the fork test is split out of test the way
// packages/state/PACKAGE.ts does it.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup builds both entries from tsup.config.js: the library and
// the tevm-mcp CLI the manifest's bin points at.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// The tsup half of build:types.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// The tsc half of build:types. Emits the declarations the manifest's types
// condition points at, into the tsconfig outDir.
const declarations = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

// typecheck. The tsconfig excludes the spec files, so tests are not key
// material here.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

// test:run, minus the fork spec so the hermetic suite never needs network.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--exclude', '**/fork.spec.ts'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, S.file('//packages/node/fixtures/fork-server.cjs')],
})

// fork.spec.ts forks live mainnet through the configured archive endpoint,
// with PublicNode as a developer fallback. The configured endpoint avoids
// public providers' short proof windows in the external-integration gate.
const testFork = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/fork.spec.ts'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, S.file('//packages/node/fixtures/fork-server.cjs')],
	sandbox: { network: 'loopback' },
})

// test:coverage. The config declares no thresholds, so there is no gate.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, S.file('//packages/node/fixtures/fork-server.cjs')],
})

// generate:docs.
const docs = Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

// lint:check.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// lint. Applies lint fixes and formatting in one pass, so it also covers the
// format script.
const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

const check = S.Suite({
	tests: [lint, typecheck, test, testFork],
})

// Not targets: `all` is a meta script that chains the others; `build` is the
// nx aggregate the build, types, and declarations targets replace; `format`
// and `format:check` are the format-only half of lint and lint:check; `test`
// is vitest in watch mode. The scratch-*.mjs files at the package root are
// manual debugging scripts, not package scripts.
export const Package = S.Package({
	targets: {
		build,
		check,
		declarations,
		docs,
		format,
		lint,
		srcs,
		test,
		testCoverage,
		testFork,
		tests,
		typecheck,
		types,
	},
})
