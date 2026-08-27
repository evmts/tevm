/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// packages/evm/PACKAGE.ts is the exemplar for this shape. This package adds
// the `declarations` target because build:types also runs tsc into the
// tsconfig outDir (types/), plus the fixture-runner targets for the
// scripts/dev.ts harness. Skipped scripts: `all` is an aggregate the check
// suite replaces, `build` is the nx run-many wrapper, `test` and `test:ui`
// are vitest watch and UI sessions, and `format`/`format:check` run only
// biome's formatter, which the lint and format targets cover through biome
// check.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources and tests are separate groups so a spec edit re-keys the test
// targets and nothing else. src/fixtures/** stays in srcs: the specs and the
// fixture runner both load config from those directories.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

// The fixture harness lives outside src so the published tarball's files
// allowlist does not ship it; it is data for the dev and fixtures targets.
const scripts = S.Filegroup({
	srcs: S.glob(['scripts/**']),
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

// build:types, tsc half. Emit lands in the tsconfig outDir (types/).
const declarations = S.Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
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

// The floors are vitest.config.ts's thresholds verbatim.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 90, functions: 89, branches: 95, statements: 90 },
})

// dev. Watches the fixture harness over every fixture in src/fixtures.
const dev = S.Shell.Run({
	bin: S.Runtime.Bun.bin,
	args: ['--watch', 'scripts/dev.ts'],
	data: [srcs, scripts, deps, tsconfig],
})

// dev:run. A single pass over every fixture; the fixtures that are expected
// to error succeed by erroring (scripts/runFixture.ts encodes which). CI's
// Fixtures step runs this script across the workspace.
const fixtures = S.Shell.Test({
	bin: S.Runtime.Bun.bin,
	args: ['scripts/dev.ts'],
	data: [srcs, scripts, deps, tsconfig],
})

// fixture. Runs one named fixture with debug logging, for local debugging.
const fixture = S.Shell.Run({
	bin: S.Runtime.Bun.bin,
	args: ['run', 'scripts/fixture.ts'],
	data: [srcs, scripts, deps, tsconfig],
})

// generate:docs.
const docs = S.Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
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

// Semver gate against the last published @tevm/config declarations.
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
	tests: [lint, typecheck, test, coverageGate, depsLint, packageLint, fixtures],
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
		dev,
		docs,
		fixture,
		fixtures,
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
