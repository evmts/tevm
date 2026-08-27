/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// Exemplar for the packages/* library shape. Every other packages/* file
// follows this one target-for-target. A sibling adds or drops a target only
// where its package.json scripts or config files differ, and says so in a
// comment beside the difference.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources and tests are separate groups so a spec edit re-keys the test
// targets and nothing else: build, types, docs, and pack key on srcs alone.
// This is nx's productionSrc/testFiles split as two filegroups.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

// Workspace dependencies as data: the build outputs of every workspace:*
// dependency in this manifest, in topological order (WORKSPACE.ts declares
// the package graph). This is nx's dependsOn ^build:dist edge as an ordinary
// data edge: an upstream change rebuilds it before this package's targets
// run, and an unrelated upstream change is a cache hit. @evmts/zevm resolves
// to //:zevm, the sibling-checkout build the workspace maps it to.
const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// build:dist. tsup reads @tevm/tsupconfig through the config file; the
// preset is a workspace dependency, so deps already covers it.
const build = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types. This package emits declarations with tsup only. Siblings
// whose script also runs `tsc --emitDeclarationOnly --declaration` carry a
// second `declarations` target into the tsconfig outDir (types/).
const types = S.Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// typecheck. tsconfig excludes the spec files, so tests are not key
// material here.
const typecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

// test:run.
const test = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// test:coverage. The run emits the v8 report; the gate below is what CI
// enforces. This config's thresholds block sets `autoUpdate: true`, which
// rewrites vitest.config.ts when coverage rises. That write lands outside
// any declared write set, so the graph treats the config as input only and
// the ratchet stays a local convenience.
const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	outDirs: ['coverage'],
})

// The floors are vitest.config.ts's thresholds verbatim, so the graph shows
// what a red coverage run means without opening the config.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 97.36, functions: 91.66, branches: 89.28, statements: 97.67 },
})

// generate:docs. typedoc resolves the entry point's imports against the
// workspace dependencies' declarations, so deps is a data edge (nx:
// generate:docs dependsOn ^build:types).
const docs = S.Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

// The publishable tarball over the manifest's files allowlist.
const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, srcs],
})

// lint:package. publint and attw run against the packed tarball, not the
// source tree, so the exports map, the dual emit, and type resolution under
// every moduleResolution are checked on what npm consumers get. The script's
// `pnpm pack --pack-destination /tmp && attw <tgz> && rm` sequence is this
// rule's definition.
const packageLint = S.Npm.PackageLint({ pack })

// Semver as a gate: baseline is the last published @tevm/evm declarations
// from the registry, surface is this tree's emit. changesets picks the bump;
// this target proves the bump covers the actual API delta. The root publish
// target gates on every //**:apiCompat.
const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// lint:deps. depcheck walks src against the manifest. A sibling whose script
// passes `--ignores=...` carries those names verbatim in args.
const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, tests, packageJson],
})

// lint:check. The package biome.json extends the root config, so both are
// key material; a rule change at the root re-lints every package.
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

// clean. Targets are key-only references naming the outDirs to remove; paths
// cover what the script removes beyond them. node_modules is left to the
// workspace's install layer.
const clean = S.Clean({
	targets: [build, types, testCoverage, docs],
	paths: ['dist', 'coverage', 'docs', 'artifacts', 'cache'],
})

// Every check ci.yml runs for this package, as one suite:
// `smthrs //packages/evm:check`.
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
