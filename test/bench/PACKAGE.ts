/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('test/bench')

// Benchmarks over the built tevm packages. Private, so there is no pack,
// packageLint, or apiCompat. The build:types script is commented out in
// package.json, so there is no types target. No script runs the spec files
// (vitest include covers them, but only the bench scripts exist), so there
// is no test target; src/arbitrum.spec.ts forks live Arbitrum and would
// need the network sandbox if one is added.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources, tests, and benchmarks are separate groups. The .sol fixtures
// stay in srcs: the benches compile them through the vite plugin in
// vitest.config.ts.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/*.bench.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const benches = S.Filegroup({
	srcs: S.glob(['src/**/*.bench.ts']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup reads @tevm/tsupconfig through the config file; the
// preset is a workspace dependency, so deps already covers it.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// bench:run. Benchmarks are not a pass/fail gate, so this is a Run, not a
// Test. The `bench` script is the same command without the explicit run
// subcommand; `bench:ui` opens the vitest UI and is skipped.
const bench = Shell.Run({
	bin: S.NodeModule.Bin('vitest'),
	args: ['bench', 'run'],
	data: [srcs, benches, deps, vitestConfig, tsconfig],
})

// lint:deps.
const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, tests, benches, packageJson],
})

// lint:check. `format:check` (`biome format .`) checks a subset of the same
// rules, so lint covers it.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, benches, biomeConfig, rootBiomeConfig],
})

// lint + format as one Diff: the `lint` and `format` scripts both rewrite
// the tree with biome.
const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, benches, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// clean. node_modules is left to the workspace's install layer.
const clean = S.Clean({
	targets: [build],
	paths: ['dist', 'artifacts', 'cache'],
})

// The `all` and nx `build` scripts are aggregates of the targets above;
// check is the package's whole CI as one suite.
const check = S.Suite({
	tests: [lint, build, depsLint],
})

export const Package = S.Package({
	targets: {
		bench,
		build,
		check,
		clean,
		depsLint,
		format,
		lint,
		srcs,
		tests,
	},
})
