/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// packages/evm/PACKAGE.ts is the exemplar for the packages/* shape. This file
// differs in three places: the tsc declaration emit into types/, tests that
// need live RPC endpoints, and the vitest setup files outside the package.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// vitest.config.ts loads two setup files: the shared matchers under
// //test/vitest-matchers and this package's test/setup.ts.
const testSetup = S.Filegroup({
	srcs: [S.file('test/setup.ts'), S.file('//test/vitest-matchers/utils.ts')],
})

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

const build = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

const types = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// The second half of build:types: tsc emits declarations into the tsconfig
// outDir (types/), which the manifest's files list ships beside dist.
const declarations = S.Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

const typecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

// Two dozen spec files (eth_call, eth_getLogs, debug_traceTransaction, the
// fork handlers) fork optimism and mainnet through the RPC URLs ci.yml
// injects, and they share files with hermetic cases, so the suite cannot be
// split by pattern. The whole run carries the secrets and the network
// sandbox; the 20 s testTimeout in vitest.config.ts exists for the same
// reason. Recording those responses into __rpc_snapshots__ is what would
// make this target hermetic.
const test = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, testSetup, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, testSetup, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
	outDirs: ['coverage'],
})

const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 84, functions: 87, branches: 67, statements: 83 },
})

const docs = S.Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, declarations, srcs],
})

const packageLint = S.Npm.PackageLint({ pack })

// actions is the largest public surface (every tevm_* and eth_* handler) and
// the most common source of accidental breaking changes, so this gate matters
// most here.
const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// @tevm/consensus is imported for types only, which depcheck cannot see.
const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	args: ['--ignores=@tevm/consensus'],
	data: [srcs, tests, packageJson],
})

const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, testSetup, biomeConfig, rootBiomeConfig],
})

const format = S.Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, testSetup, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

const clean = S.Clean({
	targets: [build, types, declarations, testCoverage, docs],
	paths: ['dist', 'types', 'coverage', 'docs', 'artifacts', 'cache'],
})

const check = S.Suite({
	tests: [lint, typecheck, coverageGate, depsLint, packageLint],
})

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
		tests,
		typecheck,
		types,
	},
})
