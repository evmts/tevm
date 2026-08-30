/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('packages/procedures')

// packages/evm/PACKAGE.ts is the exemplar for the common shape; this file
// declares the reduced script set this package has. There are no test or
// generate:docs scripts, so no test, coverage, or docs targets; the
// vitest.config.ts and typedoc.json in this directory are unused leftovers.
// Scripts with no target: `build` is an nx aggregate the graph replaces,
// `format`/`format:check` run `biome format`, which `biome check` covers,
// and `package:up` is a dependency installer.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// Sources only: this package has no spec files.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**']),
})

// Workspace dependencies as data: the build outputs of every workspace:*
// dependency in this manifest, in topological order.
const deps = S.Filegroup({ srcs: [packageJson] })

// build:dist.
const build = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// build:types. This package emits declarations with tsup only.
const types = Shell.Build({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, tsupConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// typecheck. tsconfig includes the manifest, so packageJson is key material.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig, packageJson],
})

// The publishable tarball over the manifest's files allowlist.
const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, types, srcs],
})

// lint:package. publint and attw run against the packed tarball, not the
// source tree.
const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

// Semver as a gate: baseline is the last published @tevm/procedures
// declarations from the registry, surface is this tree's emit.
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

// lint:check. The package biome.json extends the root config, so both are
// key material.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, biomeConfig, rootBiomeConfig],
})

// lint + format as one Diff: `biome check --write --unsafe` applies lint
// fixes and formatting inside the package.
const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// clean. node_modules is left to the workspace's install layer.
const clean = S.Clean({
	targets: [build, types],
	paths: ['dist', 'artifacts', 'cache'],
})

// Every check ci.yml runs for this package, as one suite:
// `smthrs //packages/procedures:check`.
const check = S.Suite({
	tests: [lint, typecheck, depsLint, packageLint],
})

export const Package = S.Package({
	targets: {
		apiCompat,
		build,
		check,
		clean,
		depsLint,
		format,
		lint,
		pack,
		packageLint,
		srcs,
		typecheck,
		types,
	},
})
