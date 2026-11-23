/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'
import { vitestBench } from '../../factory/bench.js'
import { Package as pkg_actions } from '../actions/PACKAGE.js'
import { Package as pkg_common } from '../common/PACKAGE.js'
import { Package as pkg_contract } from '../contract/PACKAGE.js'
import { Package as pkg_node } from '../node/PACKAGE.js'
import { Package as pkg_predeploys } from '../predeploys/PACKAGE.js'

const Shell = scopedShell('packages/memory-client')

// packages/contract/PACKAGE.ts is the exemplar for the packages/* shape. This
// package sits near the top of the workspace graph, so its WorkspaceDeps
// closure is most of packages/*; the value of the topological data edge shows
// here, where nx previously rebuilt the world on any change. It adds the tsc
// declaration emit and a depcheck ignore list.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')
// The ../zevm addon is outside the workspace. build-native.mjs records its
// SHA-256 here, so a rebuilt addon re-keys the native test targets.
const nativeAddon = S.file('//factory/native-addon.sha256')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const benches = S.Filegroup({
	srcs: S.glob(['bench/**']),
})

const deps = S.Filegroup({ srcs: [packageJson, pkg_actions.build, pkg_node.build] })
const fuzzDeps = S.Filegroup({ srcs: [pkg_common.build, pkg_contract.build, pkg_predeploys.build] })

const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

const declarations = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, fuzzDeps, vitestConfig, tsconfig, nativeAddon],
})

// vitest.config.ts sets `autoUpdate: true`; see packages/contract/PACKAGE.ts for
// why the graph treats the config as input only.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, fuzzDeps, vitestConfig, tsconfig, nativeAddon],
})

const coverageGate = S.Alias(testCoverage)

const docs = Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, declarations, srcs],
})

const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// @tevm/errors is reached through re-exports and kzg-wasm is loaded by the
// EVM at runtime; neither shows up as a direct import.
const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	args: ['--ignores=@tevm/errors,kzg-wasm'],
	data: [srcs, tests, packageJson],
})

const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

const clean = S.Clean({
	targets: [build, types, declarations, testCoverage, docs],
	paths: ['dist', 'types', 'coverage', 'docs', 'artifacts', 'cache'],
})

const check = S.Suite({
	tests: [lint, typecheck, coverageGate, depsLint, packageLint],
})

const bench = vitestBench('packages/memory-client', {
	data: [srcs, benches, deps, tsconfig],
})

export const Package = S.Package({
	targets: {
		bench,
		benches,
		apiCompat,
		build,
		check,
		clean,
		coverageGate,
		declarations,
		depsLint,
		docs,
		format,
		lint,
		pack,
		packageLint,
		srcs,
		test,
		testCoverage,
		tests,
		typecheck,
		types,
	},
})
