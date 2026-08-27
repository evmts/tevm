/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// packages/evm/PACKAGE.ts is the exemplar for this shape. This package adds
// the `declarations` target because build:types also runs tsc into the
// tsconfig outDir (types/). The package is private, so there are no pack,
// packageLint, or apiCompat targets; the lint:package script is dead config
// until the package is published. Skipped scripts: `all` is an aggregate the
// check suite replaces, `build` is the nx run-many wrapper, `test` and
// `test:ui` are vitest watch and UI sessions, and `format`/`format:check`
// run only biome's formatter, which the lint and format targets cover
// through biome check.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources and tests are separate groups so a spec edit re-keys the test
// targets and nothing else.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

// The specs import the shared harness in test/ (config, prepare, state), so
// that directory is part of the test key alongside the specs themselves.
const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**', 'test/**']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// build:dist. tsup emits both entries (src/index.ts, src/react/index.ts).
const build = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, tsup half.
const types = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, tsc half. Emit lands in the tsconfig outDir (types/).
const declarations = S.Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig, packageJson],
	outDirs: ['types'],
})

// tsconfig has no spec exclude, so the specs are typechecked too and tests
// are key material.
const typecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, deps, tsconfig],
})

// test:run.
const test = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// test:coverage.
const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	outDirs: ['coverage'],
})

// The floors are vitest.config.ts's thresholds verbatim. The config lowers
// them temporarily while React tests are skipped pending a
// @latticexyz/store-sync fix.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 49, functions: 54, branches: 32, statements: 49 },
})

// generate:docs.
const docs = S.Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

// lint:deps. The --ignores list is the script's, verbatim.
const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	args: ['--ignores=@testing-library/react,@tevm/config,@tevm/decorators,@tevm/node,@types/react-dom'],
	data: [srcs, tests, packageJson],
})

// lint:check.
const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// lint, as a Diff.
const format = S.Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// clean, minus node_modules, which the workspace install layer owns.
const clean = S.Clean({
	targets: [build, types, declarations, testCoverage, docs],
	paths: ['dist', 'types', 'coverage', 'docs', 'artifacts', 'cache'],
})

// Every check ci.yml runs for this package, as one suite.
const check = S.Suite({
	tests: [lint, typecheck, test, coverageGate, depsLint],
})

export const Package = S.Package({
	targets: {
		build,
		check,
		clean,
		coverageGate,
		declarations,
		depsLint,
		docs,
		format,
		lint,
		srcs,
		test,
		testCoverage,
		tests,
		typecheck,
		types,
	},
})
