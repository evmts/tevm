/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// Follows the packages/evm/PACKAGE.ts exemplar. Differences: build:types also
// runs tsc (declarations target), and forkFidelity.spec.ts forks live
// networks, so the fork test is split out of test the way
// packages/state/PACKAGE.ts does it.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// vitest loads this shared setup file (setupFiles in vitest.config.ts), so it
// is key material for every test target.
const matcherUtils = S.file('//test/vitest-matchers/utils.ts')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

// @evmts/zevm resolves to //:zevm, the sibling-checkout build the workspace
// maps it to.
const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// build:dist.
const build = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// The tsup half of build:types.
const types = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// The tsc half of build:types. Emits the declarations the manifest's import
// types condition points at, into the tsconfig outDir.
const declarations = S.Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

// typecheck. The tsconfig excludes the spec files, so tests are not key
// material here.
const typecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

// test:run, minus the fork-fidelity spec so the hermetic suite never needs
// network.
const test = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--exclude', '**/forkFidelity.spec.ts'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, matcherUtils],
})

// forkFidelity.spec.ts reconstructs blocks fetched from live mainnet and
// optimism endpoints through the RPC URLs CI injects. It gets the network
// sandbox and the two secrets the spec reads; a flaky provider cannot fail
// the hermetic suite.
const testFork = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/forkFidelity.spec.ts'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, matcherUtils],
	secrets: [S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

// test:coverage. Covers the hermetic suite; the fork spec stays out so the
// report is reproducible offline.
const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage', '--exclude', '**/forkFidelity.spec.ts'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, matcherUtils],
	outDirs: ['coverage'],
})

// The floors are vitest.config.ts's thresholds verbatim.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 94, functions: 86, branches: 83, statements: 94 },
})

// generate:docs.
const docs = S.Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, declarations, srcs],
})

// lint:package. The script packs to /tmp and runs attw on the tarball; this
// rule runs both linters against the packed tarball directly.
const packageLint = S.Npm.PackageLint({ pack })

const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// lint:deps.
const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, tests, packageJson],
})

// lint:check.
const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// lint. Applies lint fixes and formatting in one pass, so it also covers the
// format script.
const format = S.Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// clean. node_modules is left to the workspace's install layer.
const clean = S.Clean({
	targets: [build, types, declarations, testCoverage, docs],
	paths: ['dist', 'types', 'coverage', 'docs', 'artifacts', 'cache'],
})

const check = S.Suite({
	tests: [lint, typecheck, test, testFork, coverageGate, depsLint, packageLint],
})

// Not targets: `all` is a meta script that chains the others; `build` is the
// nx aggregate the build, types, and declarations targets replace; `format`
// and `format:check` are the format-only half of lint and lint:check; `test`
// is vitest in watch mode; `package:up` is an interactive installer.
export const Package = S.Package({
	targets: {
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
		testFork,
		tests,
		typecheck,
		types,
	},
})
