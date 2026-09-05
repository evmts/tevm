/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('configs/tsupconfig')

// The shared tsup preset, following the packages/evm exemplar. Sources are
// plain .js with jsdoc; there are no tests. The `test:run` script is
// `tsup --dts-only`: a build of the declarations, not a test run, so it is
// the types target below rather than a test target.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const typedocConfig = S.file('typedoc.json')
const rootBiomeConfig = S.file('//biome.json')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist. tsup.config.ts imports the preset from src directly, so the
// config file and srcs cover each other here.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, first half: tsup's dts emit into dist. This is also what the
// test:run script runs.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types, second half: `tsc --emitDeclarationOnly --declaration`
// verbatim, into the tsconfig outDir (types/).
const declarations = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--emitDeclarationOnly', '--declaration'],
	data: [srcs, deps, tsconfig],
	outDirs: ['types'],
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

// Semver as a gate against the last published @tevm/tsupconfig
// declarations.
const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// lint:deps.
const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, packageJson],
})

// lint:check. The package has no own biome.json, so the root config is the
// only rule source. `format:check` checks a subset of the same rules, so
// lint covers it.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, rootBiomeConfig],
})

// lint + format as one Diff: the `lint` and `format` scripts both rewrite
// the tree with biome.
const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, rootBiomeConfig],
	changes: ['**'],
})

// clean. node_modules is left to the workspace's install layer.
const clean = S.Clean({
	targets: [build, types, declarations, docs],
	paths: ['dist', 'types', 'docs', 'artifacts', 'cache'],
})

// The `all` and nx `build` scripts are aggregates of the targets above;
// check is the package's whole CI as one suite.
const check = S.Suite({
	tests: [lint, types, declarations, depsLint, packageLint],
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
		types,
	},
})
