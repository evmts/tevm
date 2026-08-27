/// <reference path="../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// Monorepo maintenance scripts as targets. The manifest's only script,
// `test`, is an `echo ... && exit 1` placeholder and is not declared.
// parity/run-suite.sh is consumed by //test and gemini.ts is a one-off
// zig-analysis helper with no script entry, so neither appears here.
const findMissingJsdocScript = S.file('jsdoc-helper/find-missing-jsdoc.js')
const addJsdocScript = S.file('jsdoc-helper/add-jsdoc.js')
const batchAddJsdocScript = S.file('jsdoc-helper/batch-add-jsdoc.js')
const createBarrelFilesScript = S.file('createBarrelFiles.ts')
const updateBiomeConfigScript = S.file('updateBiomeConfig.ts')
const prepareChangesetPublishScript = S.file('prepare-changeset-publish.mjs')
const publishJsrScript = S.file('publish-jsr.js')
const tevmJsrJson = S.file('//tevm/jsr.json')
const tevmPackageJson = S.file('//tevm/package.json')

// Everything the jsdoc-helper scripts walk.
const packageSources = S.Filegroup({
	srcs: S.glob(['//packages/**/src/**']),
})

const triageSources = S.Filegroup({
	srcs: S.glob(['claude-triage/**']),
})

// find-missing-jsdoc.js lists exported symbols missing JSDoc across the
// packages. A pure node script: no model API, no network.
const findMissingJsdoc = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['jsdoc-helper/find-missing-jsdoc.js'],
	data: [packageSources, findMissingJsdocScript],
})

// add-jsdoc.js inserts skeleton JSDoc above undocumented exports in one
// file; the operator passes the file path at invocation. Regex-based like
// the finder, so no secret and no network.
const addJsdoc = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['jsdoc-helper/add-jsdoc.js'],
	data: [packageSources, addJsdocScript],
	changes: ['//packages/**/src/**'],
})

// batch-add-jsdoc.js spawns add-jsdoc.js for every eligible file under a
// directory (packages here).
const batchAddJsdoc = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['jsdoc-helper/batch-add-jsdoc.js', 'packages'],
	data: [packageSources, batchAddJsdocScript],
	changes: ['//packages/**/src/**'],
})

// createBarrelFiles.ts rewrites the index barrel of the directory it runs
// in from the files present there.
const createBarrelFiles = S.Shell.Diff({
	bin: S.Runtime.Bun.bin,
	args: ['createBarrelFiles.ts'],
	data: [packageSources, createBarrelFilesScript],
	changes: ['**/index.js', '**/index.ts'],
})

// updateBiomeConfig.ts regenerates the root biome config's ignore list
// from the tree. Committed codegen: check fails on drift, --write updates.
const updateBiomeConfig = S.Generate({
	bin: S.Runtime.Bun.bin,
	args: ['updateBiomeConfig.ts'],
	data: [updateBiomeConfigScript, S.file('//biome.json')],
	changes: ['//biome.json'],
})

// claude-triage/run-triage.sh checks for python3 and gh, then runs
// triage-loop.py, which drives the claude CLI over open issues and writes
// reports under .claude/triage-reports.
const claudeTriage = S.Shell.Run({
	bin: S.Host.bin('python3'),
	args: ['claude-triage/triage-loop.py'],
	data: [triageSources],
	sandbox: { network: true },
})

// prepare-changeset-publish.mjs marks the sibling zevm checkout's @evmts
// manifests private before a changesets publish. It exits 0 outside
// GitHub Actions. The root //:publish target consumes it.
const prepareChangesetPublish = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['prepare-changeset-publish.mjs'],
	data: [prepareChangesetPublishScript],
})

// publish-jsr.js rewrites tevm/jsr.json to the workspace version and runs
// `jsr publish --allow-slow-types` (installing the jsr CLI globally if
// missing). JSR auth is OIDC from CI, so no token secret.
// //tevm:publishJsr is the declarative form of this publish.
const publishJsr = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['publish-jsr.js'],
	data: [publishJsrScript, tevmJsrJson, tevmPackageJson],
	sandbox: { network: true },
	approval: 'required',
})

export const Package = S.Package({
	targets: {
		addJsdoc,
		batchAddJsdoc,
		claudeTriage,
		createBarrelFiles,
		findMissingJsdoc,
		prepareChangesetPublish,
		publishJsr,
		updateBiomeConfig,
	},
})
