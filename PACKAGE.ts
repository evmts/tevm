/// <reference path="./smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { Package as compiler } from './bundler-packages/compiler/PACKAGE.js'
import { Package as cli } from './cli/PACKAGE.js'
import { Package as viem } from './extensions/viem/PACKAGE.js'
import { Package as factory } from './factory/PACKAGE.js'
import { Package as mcp } from './packages/mcp/PACKAGE.js'

// PACKAGE.ts files are discovered automatically: the CLI globs the tree and
// indexes each file's Package export under path-derived labels
// (//packages/evm:test, //test:conformanceFast, //:lint). Only targets passed
// to S.Package are public; consts that stay out of the map are private to
// this file. This root file holds tree-wide targets. Per-package targets
// live beside their packages, and Query patterns aggregate them here without
// central imports, so a new package joins CI by existing.
const packageJson = S.file('//package.json')
const lockfile = S.file('//pnpm-lock.yaml')
const workspaceConfig = S.file('//pnpm-workspace.yaml')
const cargoManifest = S.file('//Cargo.toml')
const cargoLockfile = S.file('//Cargo.lock')
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
		'!**/.tmp-*/**',
		'!**/.smithers/**',
		'!**/artifacts/**',
		'!**/vendor/**',
	]),
})

// vendor/flows (the Smithers build source the @smthrs/* link: dependencies
// resolve through) and vendor/zevm (the @evmts/zevm pnpm workspace member)
// are gitlinks the repository index pins. This target materializes them at
// their pinned commits and refuses a worktree that drifted from its gitlink;
// CI checks them out with the tree because the graph declares it.
const vendor = S.Git.Submodules({
	config: S.file('//.gitmodules'),
	paths: ['vendor/*'],
})

// The vendored EVM's npm build. Every @tevm package imports @evmts/zevm
// types from its dist, so the build is a declared artifact inside the
// workspace now that the checkout is: the gitlink keys it, and the aggregate
// Nx fan-outs below take it as a data edge so nothing typechecks before it.
const zevm = S.Shell.Build({
	bin: S.PackageManager.bin,
	args: ['--filter', '@evmts/zevm', 'build'],
	data: [vendor, workspaceConfig, lockfile],
	outDirs: ['vendor/zevm/npm/zevm/dist'],
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

// Manifest hygiene. sort-package-json --check is the lint every gate runs,
// a plain test over the manifests; the Diff form is the --write repair,
// confined to the manifest write set. (A Generate check materializes its
// tree into a scratch copy, which cost twelve minutes per run here.)
const manifestGlobs = [
	'package.json',
	'bundler-packages/*/package.json',
	'configs/*/package.json',
	'examples/*/package.json',
	'extensions/*/package.json',
	'packages/*/package.json',
	'tevm/package.json',
]

const manifests = S.Filegroup({
	srcs: S.glob(manifestGlobs),
})

const sortManifestsCheck = S.Shell.Test({
	bin: S.NodeModule.Bin('sort-package-json'),
	args: ['--check', ...manifestGlobs],
	data: [manifests],
})

const sortManifests = S.Shell.Diff({
	bin: S.NodeModule.Bin('sort-package-json'),
	args: manifestGlobs,
	data: [manifests],
	changes: ['package.json', '*/package.json', '*/*/package.json'],
})

// The root half of the lint:deps script: depcheck over the root manifest.
const depsLint = S.Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	data: [packageJson, lockfile, rootFiles],
})

// Current Flows executes every package target by exact label but does not yet
// expose a Query value inside PACKAGE.ts. These compatibility targets keep the
// established Nx fan-out authoritative for root-wide gates while the much
// more granular package targets remain runnable one at a time. Each command is
// content-keyed on the repository inputs and can be replaced by a native query
// without changing any consumer when that authoring primitive lands.
const aggregateData = [tree, packageJson, lockfile, workspaceConfig, zevm]

// Flows is the outer content-addressed runner. Nx stays as the compatibility
// fan-out inside these aggregate targets, but its workspace daemon and remote
// cache must not introduce shared mutable state or network access between
// concurrently evaluated sandboxes.
const nxEnvironment = {
	NX_DAEMON: 'false',
	NX_NO_CLOUD: 'true',
} as const

const allBuilds = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'build:dist'],
	data: aggregateData,
	env: nxEnvironment,
})

const allTypes = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'build:types'],
	data: aggregateData,
	env: nxEnvironment,
})

const allDeclarations = S.Alias(allTypes)

const allTypechecks = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['exec', 'nx', 'run-many', '--target=typecheck'],
	data: aggregateData,
	env: nxEnvironment,
})

// The legacy Nx test:run fan-out mixes tests with different capabilities.
// These four projects are exercised below through their first-class Flows
// targets, where egress and secrets stay explicit. Everything else gets only
// loopback: enough for in-process HTTP/WebSocket suites, never internet access.
const allHermeticTests = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: [
		'exec',
		'nx',
		'run-many',
		'--target=test:run',
		'--exclude=@tevm/compiler,@tevm/viem,@tevm/mcp,@tevm/cli',
		'--parallel=2',
		'--skip-nx-cache',
	],
	data: aggregateData,
	env: nxEnvironment,
	sandbox: { network: 'loopback' },
})

const externalIntegrationTests = S.Suite({
	tests: [compiler.test, viem.test, mcp.test, mcp.testFork, cli.testVitest],
})

const allTests = S.Suite({
	tests: [allHermeticTests, externalIntegrationTests],
})

// The Nx coverage fan-out still reaches the packages whose suites fork live
// chains (state, actions, blockchain, viem, cli, whatsabi, test), so it
// declares the same three integration secrets and egress those packages'
// first-class targets declare; CI maps the secrets into the job for it.
const integrationSecrets = [
	S.Secret('TEVM_TEST_ALCHEMY_KEY'),
	S.Secret('TEVM_RPC_URLS_MAINNET'),
	S.Secret('TEVM_RPC_URLS_OPTIMISM'),
]

const allCoverage = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'test:coverage'],
	data: aggregateData,
	env: nxEnvironment,
	secrets: integrationSecrets,
	sandbox: { network: true },
})

const allDocs = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'generate:docs'],
	data: aggregateData,
	env: nxEnvironment,
})

const allLints = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'lint:check'],
	data: aggregateData,
	env: nxEnvironment,
})

const allDepsLints = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'lint:deps'],
	data: aggregateData,
	env: nxEnvironment,
})

const allPackageLints = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'lint:package'],
	data: aggregateData,
	env: nxEnvironment,
})

// Individual //<package>:apiCompat targets remain available. Until target
// queries can be embedded, the aggregate release guard uses the publish-shape
// suite that exercises every packed package.
const allApiCompat = S.Alias(allPackageLints)

// CI's "Fixtures" step (`pnpm -r dev:run`): every package that runs its
// fixtures as a check.
const allFixtures = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['exec', 'nx', 'run-many', '--target=dev:run'],
	data: aggregateData,
	env: nxEnvironment,
	secrets: integrationSecrets,
	sandbox: { network: true },
})

const cargoBuilds = S.Shell.Test({
	bin: S.Host.bin('cargo'),
	args: ['build', '--workspace'],
	data: [cargoManifest, cargoLockfile],
})

const cargoTests = S.Shell.Test({
	bin: S.Host.bin('cargo'),
	args: ['test', '--workspace'],
	data: [cargoManifest, cargoLockfile],
})

// CI's "Validate Cargo workspace" step: `cargo check --workspace --quiet`,
// keyed through the cargo workspace layer on every crate's sources.
const cargoCheck = S.Shell.Test({
	bin: S.Host.bin('cargo'),
	args: ['check', '--workspace', '--quiet'],
	data: [
		cargoManifest,
		cargoLockfile,
		S.Filegroup({ srcs: S.glob(['bundler-packages/*-rs/src/**', 'bundler-packages/*-rs/Cargo.toml']) }),
	],
})

// Every PR touching a publishable package needs a changeset; status against
// origin/main is the same check release:check runs.
// `changeset status` also verifies every internal dependency names the
// current version, so the manifests are key material beside the diff.
const changesetCheck = S.Shell.Test({
	bin: S.NodeModule.Bin('@changesets/cli', 'changeset'),
	args: ['status', '--verbose', '--since=origin/main'],
	data: [changesets, changesetConfig, tree, S.gitDiff()],
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

// PRs #1894, #1971, #1969, #2049/#2081, and #2076 show a recurring
// failure mode: the internal value is plausible while the JSON-RPC wire
// value, type union, dispatch registration, or public client surface is not.
const rpcContractLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/rpc-contract.md'),
	data: [
		S.gitDiff({
			paths: [
				'packages/actions/src/**',
				'packages/jsonrpc/src/**',
				'packages/memory-client/src/**',
				'packages/decorators/src/**',
				'packages/procedures/src/**',
				'packages/server/src/**',
				'tevm/**/index.ts',
			],
		}),
	],
	fixes: [
		'packages/actions/src/**',
		'packages/jsonrpc/src/**',
		'packages/memory-client/src/**',
		'packages/decorators/src/**',
		'packages/procedures/src/**',
		'packages/server/src/**',
		'tevm/**',
	],
})

// A coverage increase is not necessarily a regression proof. This lint is
// grounded in follow-up review findings on stateful, negative, and alternate
// encoding branches in PRs #2076, #2079, #2090, and #2094.
const regressionProofLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/regression-proof.md'),
	data: [
		S.gitDiff({
			paths: [
				'packages/**/src/**',
				'bundler-packages/**/src/**',
				'extensions/**/src/**',
				'test/**/*.spec.ts',
				'test/**/*.test.ts',
				'test/**/fixtures/**',
			],
		}),
	],
	fixes: [
		'packages/**/*.spec.ts',
		'packages/**/*.test.ts',
		'bundler-packages/**/*.spec.ts',
		'bundler-packages/**/*.test.ts',
		'extensions/**/*.spec.ts',
		'extensions/**/*.test.ts',
		'test/**',
	],
})

// The author's merged PRs are materially narrower than closed/unmerged work,
// but PR #2091 proves raw size is the wrong signal. This check-only lint
// distinguishes coherent mechanical fan-out from unrelated agent churn.
const scopeCoherenceLint = S.Agent.Lint({
	agent: S.Agents.luna,
	prompt: S.file('//workflows/lints/scope-coherence.md'),
	data: [S.gitDiff()],
})

const agentLints = S.Suite({
	tests: [
		jsdocLint,
		changesetLint,
		noMocksLint,
		barrelExportsLint,
		snapshotPathsLint,
		docsParityLint,
		rpcContractLint,
		regressionProofLint,
		scopeCoherenceLint,
	],
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
	tests: [lint, changesetCheck, factory.check],
})

// Agent candidate loops can execute deterministic tool gates against their
// scratch tree, but cannot recursively spawn another Agent.Lint. The script
// runs static analysis and hermetic tests sequentially, using one daemonless
// Nx scheduler at a time. It permits loopback for local integration servers
// but never egress. External integrations remain a maintainer-only pre-push
// lane with their own declared secrets and network capabilities below.
const mechanicalPrePush = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/mechanical-pre-push.mjs'],
	data: aggregateData,
	env: nxEnvironment,
	sandbox: { network: 'loopback' },
})

const prePush = S.Suite({
	tests: [mechanicalPrePush, externalIntegrationTests, agentLints],
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
		sortManifestsCheck,
		allDepsLints,
		allPackageLints,
		allDocs,
		cargoBuilds,
		cargoCheck,
		factory.check,
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
const versionPackages = S.Changesets.Version({
	config: changesetConfig,
	data: [changesets],
	changes: ['**/package.json', '**/CHANGELOG.md', '.changeset/**'],
})

const version = S.Shell.Diff({
	bin: S.PackageManager.bin,
	args: ['install', '--lockfile-only'],
	data: [versionPackages, packageJson, workspaceConfig],
	changes: ['pnpm-lock.yaml'],
	sandbox: { network: true },
})

const publish = S.Shell.Run({
	bin: S.PackageManager.bin,
	args: ['run', 'release:publish'],
	data: [allBuilds, allTypes, allDeclarations, cargoBuilds],
	env: nxEnvironment,
	gates: [ci, allApiCompat],
	secrets: [S.Secret('NPM_TOKEN')],
	sandbox: 'none',
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

const prerelease = S.Shell.Run({
	bin: S.PackageManager.bin,
	args: ['run', 'release:publish'],
	data: [allBuilds, allTypes, allDeclarations, cargoBuilds, S.file('//.changeset/pre.json')],
	env: nxEnvironment,
	gates: [ci, allApiCompat],
	secrets: [S.Secret('NPM_TOKEN')],
	sandbox: 'none',
	approval: 'required',
})

// snapshot.yml: a one-off snapshot release of every package from the
// current tree (changesets-snapshot), on dispatch only.
const snapshot = S.Shell.Run({
	command: 'pnpm exec changeset version --snapshot snapshot && pnpm run release:publish',
	data: [allBuilds, allTypes, allDeclarations],
	env: nxEnvironment,
	gates: [ci],
	secrets: [S.Secret('NPM_TOKEN'), S.Secret('GITHUB_TOKEN')],
	sandbox: 'none',
	approval: 'required',
})

// Committing and PR-opening are targets, so their guards are the same suites
// CI runs; a commit that would fail CI cannot be created. Invoking the
// target is the consent for its outward action.
const commit = S.Git.Commit({
	gates: [preCommit],
	message: S.Agents.luna!,
})

const pr = S.Git.Pr({
	gates: [prePush],
	secrets: [S.Secret('GITHUB_TOKEN')],
	sandbox: { network: true },
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
		allApiCompat,
		allBuilds,
		allCoverage,
		allDeclarations,
		allDepsLints,
		allDocs,
		allFixtures,
		allHermeticTests,
		allLints,
		allPackageLints,
		allTests,
		allTypechecks,
		allTypes,
		barrelExportsLint,
		cargoBuilds,
		cargoCheck,
		cargoTests,
		changesetCheck,
		changesetLint,
		ci,
		clean,
		commit,
		depsLint,
		docsParityLint,
		externalIntegrationTests,
		format,
		jsdocLint,
		lint,
		mechanicalPrePush,
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
		regressionProofLint,
		retainCommit,
		rpcContractLint,
		scopeCoherenceLint,
		snapshot,
		snapshotPathsLint,
		sortManifests,
		sortManifestsCheck,
		vendor,
		version,
		zevm,
	},
})
