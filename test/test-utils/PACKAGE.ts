/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('test/test-utils')

// Shared test fixtures: compiled contract fixtures (.s.sol.ts next to
// their .sol sources), Alchemy URL helpers, and cached transports. The
// generated contract fixtures are committed, so generate:contracts is a
// Generate target that fails on drift.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources and tests are separate groups. The .sol sources and the committed
// .sol.ts fixtures they generate both stay in srcs: the tarball ships src
// and the fixtures are its main content.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup bundles through @tevm/esbuild-plugin so the .sol imports
// compile; the plugin is a workspace dependency, so deps already covers it.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types. Declarations come from tsup only; there is no tsc
// --emitDeclarationOnly step, so no declarations target.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// generate:contracts. tevm-gen (from the @tevm/ts-plugin build, covered by
// deps) rewrites the committed .sol.ts fixtures next to the .sol sources.
// check regenerates and fails on drift; --write updates the tree.
const generateContracts = S.Generate({
	bin: S.Mise.bin('bun'),
	args: ['run', 'node_modules/@tevm/ts-plugin/dist/bin/tevm-gen.js'],
	data: [srcs, deps],
	changes: ['src/**/*.sol.ts'],
})

// test:coverage. This is the package's only test entry point: there is no
// plain test:run script. One test in src/fixtures.spec.ts ("uses the
// exported Optimism transport against a pinned real block") hits the live
// Optimism RPC and cannot be split out by pattern, so the target keeps the
// secrets and the network sandbox.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

// The thresholds are vitest.config.ts's verbatim: all zero. The gate passes
// on any report; it exists so the floors are explicit when they are raised.
const coverageGate = S.Alias(testCoverage)

// bench:run. No .bench.ts files exist today, so the run is a placeholder
// for when benchmarks land. `bench` is the same command without the
// explicit run subcommand; `bench:ui` opens the vitest UI and is skipped.
const bench = Shell.Run({
	bin: S.NodeModule.Bin('vitest'),
	args: ['bench', 'run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
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
	data: [build, types, srcs],
})

// lint:package. publint --strict and attw --pack run against the packed
// tarball.
const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

// Semver as a gate against the last published @tevm/test-utils
// declarations.
const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// lint:deps, with the script's --ignores verbatim.
const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	args: ['--ignores=@latticexyz/schema-type,@latticexyz/store,@latticexyz/world,@openzeppelin/contracts,@tevm/common'],
	data: [srcs, tests, packageJson],
})

// lint:check. `format:check` (`biome format .`) checks a subset of the same
// rules, so lint covers it.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// lint + format as one Diff: the `lint` and `format` scripts both rewrite
// the tree with biome.
const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// clean. node_modules is left to the workspace's install layer.
const clean = S.Clean({
	targets: [build, types, testCoverage, docs],
	paths: ['dist', 'coverage', 'docs', 'artifacts', 'cache'],
})

// The `all` and nx `build` scripts are aggregates of the targets above.
// There is no typecheck script, so there is no typecheck target; check is
// the package's whole CI as one suite.
const check = S.Suite({
	tests: [lint, coverageGate, depsLint, packageLint, generateContracts],
})

export const Package = S.Package({
	targets: {
		apiCompat,
		bench,
		build,
		check,
		clean,
		coverageGate,
		depsLint,
		docs,
		format,
		generateContracts,
		lint,
		pack,
		packageLint,
		srcs,
		testCoverage,
		tests,
		types,
	},
})
