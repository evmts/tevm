/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('extensions/test-matchers')

// Vitest matchers for tevm, following the packages/evm exemplar. The specs
// fork no live network, so there is no testFork target.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const vitestConfig = S.file('vitest.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources and tests are separate groups so a spec edit re-keys the test
// targets and nothing else. The .type-spec.ts files are vitest typecheck
// tests (vitest.config.ts typecheck.include), so they live in tests.
const srcs = S.Filegroup({
	srcs: S.glob([
		'src/**',
		'!src/**/*.spec.ts',
		'!src/**/*.test.ts',
		'!src/**/*.type-spec.ts',
		'!src/**/__snapshots__/**',
	]),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.type-spec.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup reads @tevm/tsupconfig through the config file; the
// preset is a workspace dependency, so deps already covers it.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, first half: tsup's dts emit into dist.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, second half: `tsc --emitDeclarationOnly --declaration
// --skipLibCheck` verbatim, into the tsconfig outDir (types/).
const declarations = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration', '--skipLibCheck'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
})

// typecheck. The tsconfig include covers all of src, spec files included,
// so tests are key material here.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, deps, tsconfig],
})

// test:run. The `test` script is the same suite in watch mode and is not a
// CI check, so it is not a target.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// test:coverage. vitest.config.ts declares no coverage thresholds, so there
// is no coverageGate: the report exists for inspection only.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
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
	data: [build, types, declarations, srcs],
})

// lint:package. publint --strict and attw --pack run against the packed
// tarball.
const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

// Semver as a gate against the last published @tevm/test-matchers
// declarations.
const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// lint:deps, with the script's --ignores verbatim.
const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	args: ['--ignores=@tevm/common'],
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
	targets: [build, types, declarations, testCoverage, docs],
	paths: ['dist', 'types', 'coverage', 'docs', 'artifacts', 'cache'],
})

// The `all` script (which also runs `pnpm i`) and the nx `build` script are
// aggregates of the targets above; `package:up` is a dependency-update
// convenience, not a check. check is the package's whole CI as one suite.
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
