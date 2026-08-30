/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('extensions/ethers')

// Adapter between tevm and ethers, following the packages/evm exemplar. The
// specs fork no live network, so there is no testFork target.
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

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup reads @tevm/tsupconfig through the config file; the
// preset is a workspace dependency, so deps already covers it.
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

// typecheck. The tsconfig include covers all of src, spec files included,
// so tests are key material here.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, deps, tsconfig],
})

// test:run. The `test` script is the same run in watch mode and adds
// nothing to CI, so it is not a target. `test:ui` opens the vitest UI and
// is likewise skipped.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// test:coverage.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// The floors are vitest.config.ts's thresholds verbatim.
const coverageGate = S.Alias(testCoverage)

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

// Semver as a gate against the last published @tevm/ethers declarations.
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

// The `all` script and the nx `build` script are aggregates of the targets
// above; check is the package's whole CI as one suite.
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
