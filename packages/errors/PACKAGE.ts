/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('packages/errors')

// packages/evm/PACKAGE.ts is the exemplar for the packages/* shape. errors is
// the floor of that shape: its only workspace dependency is @evmts/zevm, so
// WorkspaceDeps settles to the zevm build alone, and the file works unchanged
// when a dependency is added later. It adds the tsc declaration emit.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
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

// test:run here is `vitest --run`, the same invocation as `vitest run`.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// Error classes are small and fully exercised; functions is held at 100.
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

const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
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
