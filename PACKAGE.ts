/// <reference path="./smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// PACKAGE.ts files are discovered automatically: the CLI globs the tree and
// indexes each file's Package export under path-derived labels
// (//packages/evm:test, //test:conformanceFast, //:lint). Only targets passed
// to S.Package are public; consts that stay out of the map are private to
// this file. This root file holds tree-wide targets. Per-package targets
// live beside their packages, and Query patterns aggregate them here without
// central imports, so a new package joins CI by existing.
const packageJson = S.file('//package.json')
const lockfile = S.file('//pnpm-lock.yaml')
const biomeConfig = S.file('//biome.json')
const changesetConfig = S.file('//.changeset/config.json')

// The root-level files the root `lint` script formats and checks (biome.json,
// package.json, *.md, *.ts). Package trees are linted by their own //<dir>:lint.
const rootFiles = S.Filegroup({
	srcs: S.glob(['biome.json', 'package.json', '*.md', '*.ts', 'jsr.json']),
})

const changesets = S.Filegroup({
	srcs: S.glob(['.changeset/**']),
})

// The whole tree as one group, for the targets that walk it (sort-package-json,
// depcheck at the root). Generated output and caches are excluded so a build
// does not re-key them.
const tree = S.Filegroup({
	srcs: S.glob([
		'**/*.{ts,tsx,js,mjs,cjs,json,md,sol}',
		'!**/node_modules/**',
		'!**/dist/**',
		'!**/coverage/**',
		'!**/docs/**',
		'!**/types/**',
		'!**/.nx/**',
		'!**/.flows/**',
		'!**/.worktrees/**',
		'!**/.smithers/**',
		'!**/artifacts/**',
	]),
})

// @evmts/zevm is a pnpm workspace member that lives in a sibling checkout
// (pnpm-workspace.yaml: ../zevm/npm/zevm). .github/actions/setup clones
// evmts/zevm at depth 1 with no pin, so CI's zevm floats with that repo's
// default branch; rev records that state rather than hiding it. Pinning a
// sha here is the fix. The checkout and build write outside the workspace
// root, which the executor refuses today (SMITHERS-NOTES.md, cross-repo
// resources).
const zevmCheckout = S.Git.Checkout({
	repository: 'https://github.com/evmts/zevm.git',
	rev: 'main',
	path: '../zevm',
})

// `pnpm --filter @evmts/zevm build` from the setup action. WORKSPACE.ts maps
// the @evmts/zevm workspace member to this target, so every package that
// depends on it gets the build as an ordinary WorkspaceDeps data edge.
const zevm = S.Shell.Build({
	bin: S.PackageManager.bin,
	args: ['--filter', '@evmts/zevm', 'build'],
	data: [zevmCheckout],
	outDirs: ['../zevm/npm/zevm/dist'],
})

// The first half of the root `lint` script: biome over the root-level files.
// Package trees are covered by allLints below.
const lint = S.Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', 'biome.json', 'package.json', '*.md', '*.ts'],
	data: [rootFiles, biomeConfig],
})

const format = S.Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '--write', '--unsafe', 'biome.json', 'package.json', '*.md', '*.ts'],
	data: [rootFiles, biomeConfig],
	changes: ['biome.json', 'package.json', '*.md', '*.ts'],
})

// Manifest hygiene as Generate: check fails on an unsorted package.json,
// --write sorts them. Replaces the sort-package-json and
// sort-package-json:check scripts. The script's apps/* and experimental/*
// globs match nothing in the tree and are dropped.
const sortManifests = S.Generate({
	bin: S.NodeModule.Bin('sort-package-json'),
	args: [
		'package.json',
		'bundler-packages/*/package.json',
		'configs/*/package.json',
		'examples/*/package.json',
		'extensions/*/package.json',
		'packages/*/package.json',
		'tevm/package.json',
	],
	data: [tree],
	changes: ['package.json', '*/package.json', '*/*/package.json'],
})

// The root half of the lint:deps script: depcheck over the root manifest.
const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [packageJson, lockfile, rootFiles],
})

// Query aggregation replaces nx run-many: a pattern settles to the set of
// public targets whose label matches, so tree-wide suites do not import every
// Package. Each name is a contract every PACKAGE.ts honors (see
// packages/evm/PACKAGE.ts). The nx targetDefaults map onto these one to one:
// build:dist, build:types, typecheck, test:run, test:coverage, generate:docs,
// lint:check, lint:deps, lint:package, dev:run, build:rust, test:rust.
const allBuilds = S.Query({ pattern: '//**:build' })

const allTypes = S.Query({ pattern: '//**:types' })

const allDeclarations = S.Query({ pattern: '//**:declarations' })

const allTypechecks = S.Query({ pattern: '//**:typecheck' })

const allTests = S.Query({ pattern: '//**:test' })

const allCoverage = S.Query({ pattern: '//**:coverageGate' })

const allDocs = S.Query({ pattern: '//**:docs' })

const allLints = S.Query({ pattern: '//**:lint' })

const allDepsLints = S.Query({ pattern: '//**:depsLint' })

const allPackageLints = S.Query({ pattern: '//**:packageLint' })

const allApiCompat = S.Query({ pattern: '//**:apiCompat' })

// CI's "Fixtures" step (`pnpm -r dev:run`): every package that runs its
// fixtures as a check.
const allFixtures = S.Query({ pattern: '//**:fixtures' })

const cargoBuilds = S.Query({ pattern: '//bundler-packages/**:build' })

const cargoTests = S.Query({ pattern: '//bundler-packages/**:testRust' })

// CI's "Validate Cargo workspace" step: `cargo check --workspace --quiet`,
// keyed through the cargo workspace layer on every crate's sources.
const cargoCheck = S.Cargo.Check({
	workspace: true,
	data: [S.Filegroup({ srcs: S.glob(['bundler-packages/*-rs/src/**', 'bundler-packages/*-rs/Cargo.toml']) })],
})

// Every PR touching a publishable package needs a changeset; status against
// origin/main is the same check release:check runs.
const changesetCheck = S.Shell.Test({
	bin: S.NodeModule.Bin('@changesets/cli', 'changeset'),
	args: ['status', '--verbose', '--since=origin/main'],
	data: [changesets, changesetConfig, S.gitDiff()],
})

// Agentic lints over the diff. Each enforces a CLAUDE.md rule that prose
// cannot: a clean diff is vacuously green with zero agent spawns, --fix lets
// the agent correct findings inside its write set, and the verdict caches
// on the diff like any other test. Agents are declared in WORKSPACE.ts.

// Exported symbols need JSDoc that typedoc can render. Grounds the
// scripts/jsdoc-helper tooling as a lint with a fix verb instead of a batch
// script.
const jsdocLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/jsdoc.md'),
	data: [S.gitDiff({ paths: ['packages/**/src/**', 'bundler-packages/**/src/**', 'extensions/**/src/**'] })],
	fixes: ['packages/**/src/**', 'bundler-packages/**/src/**', 'extensions/**/src/**'],
})

// A diff that changes published source carries a changeset whose level
// matches the change. changesetCheck above only tests presence; judging
// patch vs minor vs major is judgment work.
const changesetLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/changeset.md'),
	data: [
		S.gitDiff({
			paths: ['packages/**/src/**', 'bundler-packages/**/src/**', 'extensions/**/src/**', 'tevm/**', '.changeset/**'],
		}),
	],
	fixes: ['.changeset/**'],
})

// Tests exercise real objects, never mocks (CLAUDE.md testing conventions).
const noMocksLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/no-mocks.md'),
	data: [S.gitDiff({ paths: ['**/*.spec.ts', '**/*.test.ts'] })],
	fixes: ['**/*.spec.ts', '**/*.test.ts'],
})

// A new public symbol is re-exported through every barrel up to the tevm
// meta package; a missed barrel is silent at type-check time.
const barrelExportsLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/barrel-exports.md'),
	data: [
		S.gitDiff({
			added: ['packages/**/src/**', 'bundler-packages/**/src/**', 'extensions/**/src/**'],
			addedLines: '^export ',
		}),
	],
	fixes: ['packages/**/src/**/index.{js,ts}', 'bundler-packages/**/src/**/index.{js,ts}', 'tevm/**/index.ts'],
})

// Snapshots must not embed the recording machine (absolute paths, temp dirs).
const snapshotPathsLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/snapshot-paths.md'),
	data: [S.gitDiff({ paths: ['**/__snapshots__/**', '**/__rpc_snapshots__/**', '**/*.spec.ts'] })],
	fixes: ['**/__snapshots__/**', '**/__rpc_snapshots__/**', '**/*.spec.ts'],
})

// A new action, JSON-RPC handler, or bundler option needs guide coverage
// under docs/node or sites/core.
const docsParityLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/docs-parity.md'),
	data: [
		S.gitDiff({
			added: [
				'packages/actions/src/**',
				'packages/memory-client/src/**',
				'packages/decorators/src/**',
				'tevm/*/index.ts',
			],
		}),
	],
	fixes: ['docs/node/pages/**', 'sites/core/pages/**'],
})

const agentLints = S.Suite({
	tests: [jsdocLint, changesetLint, noMocksLint, barrelExportsLint, snapshotPathsLint, docsParityLint],
})

// The claude-code-review.yml checklist as a target: the same review,
// runnable locally before pushing.
const prReview = S.Agent.Lint({
	agent: S.Agents.reviewPool,
	prompt: S.file('//.github/workflows/claude-code-review.yml'),
	data: [S.gitDiff()],
})

// Filegroup groups files, Suite groups tests, Alias renames one target. A
// dependency edge always means "materialize files", never "execute".
const preCommit = S.Suite({
	tests: [lint, changesetCheck],
})

const prePush = S.Suite({
	tests: [allLints, allTypechecks, allTests, agentLints],
})

// Every commit is retained as a memory fact, so agent targets see recent
// history without re-reading git.
const retainCommit = S.Memory.Retain({
	source: S.gitCommit('HEAD'),
	tags: ['commit'],
})

const postCommit = S.Suite({
	tests: [retainCommit],
})

// ci.yml's steps as one suite, in its order: build dist, build types, tests,
// fixtures, rust tests, typecheck, lint, lint deps, lint packages, docs,
// cargo check. An unaffected target is a cache hit, so the whole suite is
// cheap on a small PR. The `build:rust:app` step targets an nx project name
// (my_rust_node_lib) that no longer exists; cargoBuilds covers what it meant.
const ci = S.Suite({
	tests: [
		allBuilds,
		allTypes,
		allDeclarations,
		allCoverage,
		allFixtures,
		cargoTests,
		allTypechecks,
		allLints,
		sortManifests,
		allDepsLints,
		allPackageLints,
		allDocs,
		cargoBuilds,
		cargoCheck,
		changesetCheck,
	],
})

// changesets owns versioning. version applies pending changesets to manifests
// and changelogs (release:version, a Diff over the tree, then
// `pnpm install --lockfile-only` for the lockfile). publish builds everything,
// runs scripts/prepare-changeset-publish.mjs, and pushes each bumped package to
// npm with provenance through the scripts/pnpm-publish-wrapper PATH shim
// (release:publish). The per-package apiCompat gates prove the chosen bumps
// cover the real API deltas before anything is public.
const version = S.Changesets.Version({
	config: changesetConfig,
	data: [changesets],
	lockfile: { update: S.PackageManager.bin },
	changes: ['**/package.json', '**/CHANGELOG.md', '.changeset/**', 'pnpm-lock.yaml'],
})

const publish = S.Changesets.Publish({
	config: changesetConfig,
	data: [allBuilds, allTypes, allDeclarations, S.Query({ pattern: '//bundler-packages/**:napi' })],
	prepare: S.file('//scripts/prepare-changeset-publish.mjs'),
	publishWrapper: S.file('//scripts/pnpm-publish-wrapper'),
	gates: [ci, allApiCompat],
	provenance: true,
	secrets: [S.Secret('NPM_TOKEN')],
	sandbox: { network: true },
	approval: 'required',
})

// prerelease.yml: main publishes under the `next` dist-tag while
// .changeset/pre.json is present. enter/exit are the two Diff halves of
// prerelease mode (prerelease.yml's `changeset pre enter next`,
// prerelease-exit.yml's `changeset pre exit`).
const prereleaseEnter = S.Shell.Diff({
	bin: S.NodeModule.Bin('@changesets/cli', 'changeset'),
	args: ['pre', 'enter', 'next'],
	data: [changesets, changesetConfig],
	changes: ['.changeset/pre.json'],
})

const prereleaseExit = S.Shell.Diff({
	bin: S.NodeModule.Bin('@changesets/cli', 'changeset'),
	args: ['pre', 'exit'],
	data: [changesets, changesetConfig],
	changes: ['.changeset/pre.json'],
})

const prerelease = S.Changesets.Publish({
	config: changesetConfig,
	data: [allBuilds, allTypes, allDeclarations, S.Query({ pattern: '//bundler-packages/**:napi' })],
	prepare: S.file('//scripts/prepare-changeset-publish.mjs'),
	publishWrapper: S.file('//scripts/pnpm-publish-wrapper'),
	pre: 'next',
	gates: [ci, allApiCompat],
	provenance: true,
	secrets: [S.Secret('NPM_TOKEN')],
	sandbox: { network: true },
	approval: 'required',
})

// snapshot.yml: a one-off snapshot release of every package from the
// current tree (changesets-snapshot), on dispatch only.
const snapshot = S.Changesets.Snapshot({
	config: changesetConfig,
	data: [allBuilds, allTypes, allDeclarations],
	gates: [ci],
	secrets: [S.Secret('NPM_TOKEN'), S.Secret('GITHUB_TOKEN')],
	sandbox: { network: true },
	approval: 'required',
})

// Committing and PR-opening are targets, so their guards are the same suites
// CI runs; a commit that would fail CI cannot be created. Invoking the
// target is the consent for its outward action.
const commit = S.Git.Commit({
	gates: [preCommit],
	message: S.Agents.luna,
})

const pr = S.Git.Pr({
	gates: [prePush],
	secrets: [S.Secret('GITHUB_TOKEN')],
	sandbox: { network: true },
})

// Full conformance is too slow for every PR, so it runs nightly; failures
// arrive as the conformance-triage workflow's input rather than a red PR.
// .github/PACKAGE.ts renders the same schedule as a GitHub workflow.
const nightlyConformance = S.Cron({
	schedule: '0 3 * * *',
	run: [S.Query({ pattern: '//test:conformanceAll' })],
})

// The root `clean` script: nx reset, every package's clean, node_modules.
// The nx cache is gone; per-package cleans are `smthrs '//**:clean'`; the
// workspace install layer owns node_modules. What remains is the tree-level
// output the runners write.
const clean = S.Clean({
	paths: ['.nx', 'artifacts', 'dist', '.flows/tmp'],
})

export const Package = S.Package({
	defaultVisibility: 'public',
	targets: {
		agentLints,
		barrelExportsLint,
		cargoCheck,
		changesetCheck,
		changesetLint,
		ci,
		clean,
		commit,
		depsLint,
		docsParityLint,
		format,
		jsdocLint,
		lint,
		nightlyConformance,
		noMocksLint,
		postCommit,
		pr,
		prReview,
		preCommit,
		prePush,
		prerelease,
		prereleaseEnter,
		prereleaseExit,
		publish,
		retainCommit,
		snapshot,
		snapshotPathsLint,
		sortManifests,
		version,
		zevm,
		zevmCheckout,
	},
})
