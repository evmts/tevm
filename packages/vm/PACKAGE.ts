/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('packages/vm')

// packages/evm/PACKAGE.ts is the exemplar for the common shape; this file
// differs in three places. Tests run under `bun test`, not vitest, and
// there is no vitest.config.ts. build:types also runs tsc, so there is a
// declarations target. `bun test --coverage` has no thresholds mechanism,
// so there is no coverageGate. The actions/package.json in this directory
// is a subpath stub for the ./actions export; it ships inside the packed
// tarball via the manifest's files allowlist and needs no target.
// Scripts with no target: `all` and `build` are nx aggregates the check
// suite and the graph replace, `test` is `bun test --watch` (interactive),
// `format`/`format:check` run `biome format`, which `biome check` covers,
// and `package:up` is a dependency installer.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
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

// Workspace dependencies as data: the build outputs of every workspace:*
// dependency in this manifest, in topological order.
const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup has two entries (index and actions), one target.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, tsup half.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, tsc half: `tsc --emitDeclarationOnly --declaration` emits
// into the tsconfig outDir (types/). The manifest's top-level `types`
// points at types/index.d.ts, so this emit is what npm consumers resolve.
const declarations = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

// typecheck. tsconfig excludes the spec files, so tests are not key
// material here.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

// test:run. `bun test` reads tsconfig directly; there is no vitest config.
// No spec file needs a live RPC, so the whole suite stays hermetic.
const test = Shell.Test({
	bin: S.Host.bin('bun'),
	args: ['test'],
	data: [srcs, tests, deps, tsconfig],
})

// test:coverage.
const testCoverage = Shell.Test({
	bin: S.Host.bin('bun'),
	args: ['test', '--coverage'],
	data: [srcs, tests, deps, tsconfig],
})

// generate:docs.
const docs = Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

// The publishable tarball over the manifest's files allowlist.
const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, declarations, srcs],
})

// lint:package. publint and attw run against the packed tarball, not the
// source tree.
const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

// Semver as a gate: baseline is the last published @tevm/vm declarations
// from the registry, surface is this tree's emit.
const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// lint:deps.
const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, tests, packageJson],
})

// lint:check. The package biome.json extends the root config, so both are
// key material.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// lint + format as one Diff: `biome check --write --unsafe` applies lint
// fixes and formatting inside the package.
const format = Shell.Diff({
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

// Every check ci.yml runs for this package, as one suite:
// `smthrs //packages/vm:check`.
const check = S.Suite({
	tests: [lint, typecheck, test, depsLint, packageLint],
})

export const Package = S.Package({
	targets: {
		apiCompat,
		build,
		check,
		clean,
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
