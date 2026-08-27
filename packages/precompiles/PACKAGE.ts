/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// packages/evm/PACKAGE.ts is the exemplar for the common shape; this file
// follows it with two differences: build:types also runs tsc, so there is a
// declarations target, and there is no typecheck script, so no typecheck
// target. Scripts with no target: `all` and `build` are nx aggregates the
// check suite and the graph replace, `test` is `vitest --watch`
// (interactive), `format`/`format:check` run `biome format`, which
// `biome check` covers, and `package:up` is a dependency installer.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')
// bunfig.toml preloads plugins.js, the bun tevm plugin that enables .sol
// imports under `bun test`. Both are key material for the test targets.
const bunfig = S.file('bunfig.toml')
const bunPlugin = S.file('plugins.js')

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

// build:types, tsc half: `tsc --emitDeclarationOnly --declaration` emits
// into the tsconfig outDir (types/).
const declarations = S.Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

// test:run. No spec file needs a live RPC, so the whole suite stays
// hermetic.
const test = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, bunfig, bunPlugin],
})

// test:coverage.
const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig, bunfig, bunPlugin],
	outDirs: ['coverage'],
})

// The floors are vitest.config.ts's thresholds verbatim.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 38, functions: 52, branches: 45, statements: 40 },
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

// lint:package. publint and attw run against the packed tarball, not the
// source tree.
const packageLint = S.Npm.PackageLint({ pack })

// Semver as a gate: baseline is the last published @tevm/precompiles
// declarations from the registry, surface is this tree's emit.
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

// lint + format as one Diff: `biome check --write --unsafe` applies lint
// fixes and formatting inside the package.
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

// Every check ci.yml runs for this package, as one suite:
// `smthrs //packages/precompiles:check`.
const check = S.Suite({
	tests: [lint, test, coverageGate, depsLint, packageLint],
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
		types,
	},
})
