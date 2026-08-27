/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// packages/evm/PACKAGE.ts is the exemplar for this shape. This package adds
// the `declarations` target because build:types also runs tsc into the
// tsconfig outDir (types/). Skipped scripts: `all` is an aggregate the check
// suite replaces, `build` is the nx run-many wrapper the build and types
// targets replace, `test` and `test:ui` are vitest watch and UI sessions,
// and `format`/`format:check` run only biome's formatter, which the lint and
// format targets already cover through biome check.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources and tests are separate groups so a spec edit re-keys the test
// targets and nothing else.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// build:dist.
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

// build:types, tsc half. The script chains
// `tsc --emitDeclarationOnly --declaration` after tsup; the emit lands in
// the tsconfig outDir (types/), which the manifest's types field points at.
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

// The floors are vitest.config.ts's thresholds verbatim. That config sets
// `autoUpdate: true`, which rewrites the config when coverage rises; the
// graph treats the config as input only and the ratchet stays local.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 99.29, functions: 100, branches: 97.82, statements: 99.31 },
})

// generate:docs.
const docs = S.Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	args: ['--plugin', 'typedoc-plugin-markdown'],
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

// The publishable tarball over the manifest's files allowlist.
const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, declarations, srcs],
})

// lint:package.
const packageLint = S.Npm.PackageLint({ pack })

// Semver gate against the last published @tevm/base-bundler declarations.
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

// lint:check. The package biome.json extends the root config, so both are
// key material.
const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// lint, as a Diff: `biome check --write --unsafe` applies lint fixes and
// formatting inside the package.
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
	tests: [lint, typecheck, test, coverageGate, depsLint, packageLint],
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
