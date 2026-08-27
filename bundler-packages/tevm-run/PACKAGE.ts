/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// A bun-native package with no build step: the build:dist and build:types
// scripts are echo placeholders saying so, and the package ships its src/
// tree directly (the manifest's files allowlist is src, bunfig.toml, and
// plugins.js). bunfig.toml preloads plugins.js, the bun tevm plugin that
// compiles .sol imports, so both are data for every bun invocation.
// Skipped scripts: `all` is an aggregate the check suite replaces, `test`
// is `bun test --watch`, an interactive session, and `format`/`format:check`
// run only biome's formatter, which the lint and format targets cover
// through biome check.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')
const bunfig = S.file('bunfig.toml')
const plugins = S.file('plugins.js')

// Sources and tests are separate groups so a spec edit re-keys the test
// targets and nothing else.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

// The example the dev target pipes through src/tevm-run.js.
const example = S.Filegroup({
	srcs: S.glob(['example/**']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// typecheck. tsconfig has no include, so tsc checks every script in the
// package, src, example, and plugins.js alike.
const typecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, example, plugins, deps, tsconfig],
})

// test:run (bun test).
const test = S.Shell.Test({
	bin: S.Runtime.Bun.bin,
	args: ['test'],
	data: [srcs, tests, deps, bunfig, plugins, tsconfig],
})

// test:coverage (bun test --coverage).
const testCoverage = S.Shell.Test({
	bin: S.Runtime.Bun.bin,
	args: ['test', '--coverage'],
	data: [srcs, tests, deps, bunfig, plugins, tsconfig],
	outDirs: ['coverage'],
})

// dev. Runs the example through the CLI in watch mode.
const dev = S.Shell.Run({
	bin: S.Runtime.Bun.bin,
	args: ['run', '--watch', 'src/tevm-run.js', 'example/example.ts'],
	data: [srcs, example, deps, bunfig, plugins, tsconfig],
})

// The publishable tarball over the manifest's files allowlist. There is no
// lint:package script, so no packageLint target, and no types emit, so no
// apiCompat target.
const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [srcs, bunfig, plugins],
})

// lint:check.
const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, example, biomeConfig, rootBiomeConfig],
})

// lint, as a Diff.
const format = S.Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, example, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// Every check ci.yml runs for this package, as one suite.
const check = S.Suite({
	tests: [lint, typecheck, test, testCoverage],
})

export const Package = S.Package({
	targets: {
		check,
		dev,
		format,
		lint,
		pack,
		srcs,
		test,
		testCoverage,
		tests,
		typecheck,
	},
})
