/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// packages/evm/PACKAGE.ts is the exemplar for the packages/* shape. This file
// adds the tsc declaration emit and splits the suite by network: the fork
// state manager's tests read live mainnet and optimism state through the RPC
// URLs ci.yml injects, so they run apart from the hermetic cases and a flaky
// provider cannot fail the hermetic target.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// The spec files that fork a live chain. They are named here, not matched
// by a pattern, because the fork-reading actions share a directory with the
// pure ones. A new fork test joins this list and the fork target.
const forkSpecs = [
	'src/createStateManager.spec.ts',
	'src/actions/getAccount.spec.ts',
	'src/actions/getAccountFromProvider.spec.ts',
	'src/actions/getContractCode.spec.ts',
	'src/actions/getContractStorage.spec.ts',
	'src/actions/getForkBlockTag.spec.ts',
	'src/actions/getForkClient.spec.ts',
	'src/actions/getProof.spec.ts',
	'src/actions/shallowCopy.spec.ts',
]

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

// Hermetic tests run without network: everything but the fork specs.
const test = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', ...forkSpecs.flatMap((spec) => ['--exclude', spec])],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

const testFork = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', ...forkSpecs],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

// test:coverage is the whole suite, fork cases included, because the
// thresholds were measured over both halves.
const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
	outDirs: ['coverage'],
})

const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 98, functions: 96, branches: 89, statements: 97 },
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

const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, tests, packageJson],
})

const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

const format = S.Shell.Diff({
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
