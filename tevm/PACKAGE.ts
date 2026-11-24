/// <reference path="../smithers.d.ts" />
const S = Smithers

import { Package as pkg_cli } from '../cli/PACKAGE.js'
import { Package as tsupconfigPkg } from '../configs/tsupconfig/PACKAGE.js'
import { Package as pkg_viem } from '../extensions/viem/PACKAGE.js'
import { vitestBench } from '../factory/bench.js'
import { scopedShell } from '../factory/scoped-shell.js'
import { Package as pkg_actions } from '../packages/actions/PACKAGE.js'
import { Package as pkg_common } from '../packages/common/PACKAGE.js'
import { Package as pkg_contract } from '../packages/contract/PACKAGE.js'
import { Package as pkg_errors } from '../packages/errors/PACKAGE.js'
import { Package as pkg_http_client } from '../packages/http-client/PACKAGE.js'
import { Package as pkg_jsonrpc } from '../packages/jsonrpc/PACKAGE.js'
import { Package as pkg_memory_client } from '../packages/memory-client/PACKAGE.js'
import { Package as pkg_node } from '../packages/node/PACKAGE.js'
import { Package as pkg_predeploys } from '../packages/predeploys/PACKAGE.js'
import { Package as pkg_server } from '../packages/server/PACKAGE.js'
import { Package as pkg_utils } from '../packages/utils/PACKAGE.js'

const Shell = scopedShell('tevm')

// The tevm meta package: re-exports every packages/* entry point and the
// bundler plugins from one manifest and, unlike them, commits its emit so npm
// and JSR publish straight from the tree. The bundler plugins, compiler,
// config, solc and ts-plugin live in evmts/tevm-bundler and resolve from the
// registry (a semver range in package.json), so the installed node_modules
// layer carries them instead of a workspace build edge.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const tsupConfig = S.file('tsup.config.js')
const typedocConfig = S.file('typedoc.json')
const jsrJson = S.file('jsr.json')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

// The entry points: index.ts at the root and one per directory. The emitted
// siblings (index.js, index.cjs, index.d.ts, index.d.cts, maps) are outputs,
// so the glob excludes them, and PACKAGE.ts is not a source.
const srcs = S.Filegroup({
	srcs: S.glob(['**/index.ts', 'cli.js', '!**/*.d.ts', '!node_modules/**', '!docs/**']),
})

const benches = S.Filegroup({
	srcs: S.glob(['bench/**']),
})

const deps = S.Filegroup({
	srcs: [
		packageJson,
		pkg_actions.build,
		pkg_cli.build,
		pkg_common.build,
		pkg_contract.build,
		pkg_errors.build,
		pkg_http_client.build,
		pkg_jsonrpc.build,
		pkg_memory_client.build,
		pkg_node.build,
		pkg_predeploys.build,
		pkg_server.build,
		pkg_utils.build,
		pkg_viem.build,
	],
})

const typeDeps = S.Filegroup({
	srcs: [
		pkg_actions.types,
		pkg_common.types,
		pkg_contract.types,
		pkg_errors.types,
		pkg_http_client.types,
		pkg_jsonrpc.types,
		pkg_memory_client.types,
		pkg_node.types,
		pkg_predeploys.types,
		pkg_server.types,
		pkg_utils.types,
		pkg_viem.types,
	],
})

// generate:dist and build:dist. The emit is committed generated output.
// Upstream, build:dist runs tsup and then `git status --porcelain` to fail on
// drift; Generate is that contract as a verb: check regenerates into a
// scratch copy and fails on drift, --write updates the tree for commit.
// tsup.config.js maps every entry directory to itself as outDir.
const dist = S.Generate({
	bin: S.NodeModule.Bin('tsup'),
	data: [srcs, deps, tsupConfig, tsupconfigPkg.build, tsconfig, packageJson],
	changes: ['**/index.js', '**/index.cjs', '**/index.js.map', '**/index.cjs.map'],
})

// generate:types and build:types: the same contract for the declarations.
const types = S.Generate({
	bin: S.NodeModule.Bin('tsup'),
	args: ['--dts-only'],
	data: [srcs, deps, typeDeps, tsupConfig, tsupconfigPkg.build, tsconfig, packageJson],
	changes: ['**/index.d.ts', '**/index.d.cts'],
})

const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, typeDeps, tsconfig],
})

const docs = Shell.Build({
	bin: S.NodeModule.Bin('typedoc'),
	data: [srcs, deps, typedocConfig, packageJson],
	outDirs: ['docs'],
})

// The `generate` script: both emits, then docs.
const generate = S.Suite({
	tests: [dist, types, docs],
})

const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [srcs, packageJson],
})

const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, biomeConfig, rootBiomeConfig],
})

const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, biomeConfig, rootBiomeConfig],
	changes: ['**/index.ts', 'cli.js'],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [srcs, dist, types],
})

// lint:package. This manifest's files list is the whole set of entry
// directories, so the packed shape is the check that matters most here.
const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

const apiCompat = S.Api.Compat({
	baseline: S.Npm.Published({ manifest: packageJson }),
	surface: types,
	manifest: packageJson,
})

// JSR is a second registry with its own manifest (this directory's jsr.json,
// @tevm/tevm) and its own auth model (OIDC from CI, interactive locally).
// jsr-publish.yml rewrites jsr.json's version from package.json before
// publishing, which is the Diff below. Publishing is outward, so it declares
// approval; the root repo's jsr.json (name "tevm", exports ./tevm/...) is a
// stale duplicate no script reads.
const jsrVersion = Shell.Diff({
	bun: "const pkg = await Bun.file('package.json').json()\nconst jsr = await Bun.file('jsr.json').json()\njsr.version = pkg.version\nawait Bun.write('jsr.json', JSON.stringify(jsr, null, 2).concat('\\n'))",
	data: [packageJson, jsrJson],
	changes: ['jsr.json'],
})

const publishJsr = Shell.Run({
	command: 'pnpm dlx jsr publish --allow-slow-types',
	data: [srcs, dist, types, jsrVersion],
	gates: [typecheck, packageLint],
	sandbox: { network: true },
	approval: 'required',
})

// publish:jsr:dry: the same publish with --dry-run, no approval needed
// because nothing leaves the machine.
const publishJsrDryRun = Shell.Run({
	command: 'pnpm dlx jsr publish --allow-slow-types --dry-run',
	data: [srcs, dist, types, jsrVersion],
	gates: [typecheck, packageLint],
	sandbox: { network: true },
})

// The `clean` script deletes every emitted js/cjs/d.ts beside the sources
// (not tsup.config.js) plus docs; the committed emit regenerates from
// //tevm:dist --write.
const clean = S.Clean({
	targets: [docs],
	paths: [
		'**/index.js',
		'**/index.cjs',
		'**/index.js.map',
		'**/index.cjs.map',
		'**/index.d.ts',
		'**/index.d.cts',
		'docs',
		'artifacts',
		'cache',
	],
})

const check = S.Suite({
	tests: [lint, typecheck, dist, types, depsLint, packageLint],
})

const bench = vitestBench('tevm', {
	data: [srcs, benches, deps, tsconfig, packageJson],
})

export const Package = S.Package({
	targets: {
		bench,
		benches,
		apiCompat,
		check,
		clean,
		depsLint,
		dist,
		docs,
		format,
		generate,
		jsrVersion,
		lint,
		pack,
		packageLint,
		publishJsr,
		publishJsrDryRun,
		srcs,
		typecheck,
		types,
	},
})
