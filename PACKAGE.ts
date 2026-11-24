/// <reference path="./smithers.d.ts" />
const S = Smithers

import { Package as baseBundler } from './bundler-packages/base-bundler/PACKAGE.js'
import { Package as bunPlugin } from './bundler-packages/bun/PACKAGE.js'
import { Package as bundlerCache } from './bundler-packages/bundler-cache/PACKAGE.js'
import { Package as compiler } from './bundler-packages/compiler/PACKAGE.js'
import { Package as config } from './bundler-packages/config/PACKAGE.js'
import { Package as esbuildPlugin } from './bundler-packages/esbuild/PACKAGE.js'
import { Package as requirejsPlugin } from './bundler-packages/requirejs/PACKAGE.js'
import { Package as resolutions } from './bundler-packages/resolutions/PACKAGE.js'
import { Package as resolutionsRs } from './bundler-packages/resolutions-rs/PACKAGE.js'
import { Package as rollupPlugin } from './bundler-packages/rollup/PACKAGE.js'
import { Package as rspackPlugin } from './bundler-packages/rspack/PACKAGE.js'
import { Package as runtime } from './bundler-packages/runtime/PACKAGE.js'
import { Package as runtimeRs } from './bundler-packages/runtime-rs/PACKAGE.js'
import { Package as solcPkg } from './bundler-packages/solc/PACKAGE.js'
import { Package as solcRs } from './bundler-packages/solc-rs/PACKAGE.js'
import { Package as tevmRun } from './bundler-packages/tevm-run/PACKAGE.js'
import { Package as unplugin } from './bundler-packages/unplugin/PACKAGE.js'
import { Package as vitePlugin } from './bundler-packages/vite/PACKAGE.js'
import { Package as webpackPlugin } from './bundler-packages/webpack/PACKAGE.js'
import { Package as whatsabi } from './bundler-packages/whatsabi/PACKAGE.js'
import { Package as cli } from './cli/PACKAGE.js'
import { Package as ethersExt } from './extensions/ethers/PACKAGE.js'
import { Package as viem } from './extensions/viem/PACKAGE.js'
import { Package as factory } from './factory/PACKAGE.js'
import { Package as lsp } from './lsp/lsp/PACKAGE.js'
import { Package as tsPlugin } from './lsp/ts-plugin/PACKAGE.js'
import { Package as vscodeExt } from './lsp/vscode/PACKAGE.js'
import { Package as actions } from './packages/actions/PACKAGE.js'
import { Package as common } from './packages/common/PACKAGE.js'
import { Package as contract } from './packages/contract/PACKAGE.js'
import { Package as effectPkg } from './packages/effect/PACKAGE.js'
import { Package as errors } from './packages/errors/PACKAGE.js'
import { Package as httpClient } from './packages/http-client/PACKAGE.js'
import { Package as jsonrpc } from './packages/jsonrpc/PACKAGE.js'
import { Package as logger } from './packages/logger/PACKAGE.js'
import { Package as mcp } from './packages/mcp/PACKAGE.js'
import { Package as memoryClient } from './packages/memory-client/PACKAGE.js'
import { Package as nodePkg } from './packages/node/PACKAGE.js'
import { Package as predeploys } from './packages/predeploys/PACKAGE.js'
import { Package as server } from './packages/server/PACKAGE.js'
import { Package as utils } from './packages/utils/PACKAGE.js'
import { Package as scripts } from './scripts/PACKAGE.js'
import { Package as lean } from './specs/lean/PACKAGE.js'
import { Package as fuzzPkg } from './test/fuzz/PACKAGE.js'
import { Package as tevmFacade } from './tevm/PACKAGE.js'

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
	srcs: S.glob(['biome.json', 'package.json', '*.md', '*.ts']),
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
		'!**/.cache/**',
		'!**/artifacts/**',
		'!**/vendor/**',
	]),
})

// vendor/flows (the Smithers build source the @smthrs/* link: dependencies
// resolve through)
// are gitlinks the repository index pins. This target materializes them at
// their pinned commits and refuses a worktree that drifted from its gitlink;
// CI checks them out with the tree because the graph declares it.
const vendor = S.Git.Submodules({
	config: S.file('//.gitmodules'),
	paths: ['vendor/flows'],
})

// Zig must check sibling source contents on every invocation. The addon lives
// outside TEVM's captured outputs, so a cached build receipt cannot restore it.
// Include release pins so dependent checks invalidate when native revisions move.
const zevm = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['scripts/factory/build-native.mjs'],
	data: [
		workspaceConfig,
		lockfile,
		S.file('//scripts/factory/build-native.mjs'),
		S.file('//scripts/factory/native-addon-stamp.mjs'),
		S.file('//mise.toml'),
		S.file('//factory/native-dependencies.json'),
	],
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
// Postinstall stages the native addon. Keep its explicit rebuild target uncached;
// release pins invalidate aggregate verdicts when any native dependency changes.
const aggregateData = [tree, packageJson, lockfile, workspaceConfig, S.file('//factory/native-dependencies.json')]

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

// The Nx fan-outs below write and read the same dist/ and types/ trees, so
// they take each other as data edges in the order the twelve-step CI ran
// them: Flows would otherwise start them all at once and one Nx process
// would read a package's types while another rewrites them.
const allTypes = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'build:types'],
	data: [...aggregateData, allBuilds],
	env: nxEnvironment,
})

const allDeclarations = S.Alias(allTypes)

const allTypechecks = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['exec', 'nx', 'run-many', '--target=typecheck'],
	data: [...aggregateData, allTypes],
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
	data: [...aggregateData, allTypechecks],
	env: nxEnvironment,
	secrets: integrationSecrets,
	sandbox: { network: true },
})

const allDocs = S.Shell.Test({
	bin: S.PackageManager.bin,
	args: ['run', 'generate:docs'],
	data: [...aggregateData, allCoverage],
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
	data: [...aggregateData, allDocs],
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
	data: [...aggregateData, allPackageLints],
	env: nxEnvironment,
	secrets: integrationSecrets,
	sandbox: { network: true },
})

const cargoInputs = [
	cargoManifest,
	cargoLockfile,
	S.Filegroup({
		srcs: [
			S.glob('bundler-packages/*-rs/**/*.rs', { exclude: ['**/target/**', '**/node_modules/**'] }),
			S.glob('bundler-packages/*-rs/Cargo.toml'),
		],
	}),
]

const cargoBuilds = S.Shell.Test({
	bin: S.Host.bin('cargo'),
	args: ['build', '--workspace'],
	data: cargoInputs,
})

const cargoTests = S.Shell.Test({
	bin: S.Host.bin('cargo'),
	args: ['test', '--workspace'],
	data: cargoInputs,
})

// CI's "Validate Cargo workspace" step: `cargo check --workspace --quiet`,
// keyed through the cargo workspace layer on every crate's sources.
const cargoCheck = S.Shell.Test({
	bin: S.Host.bin('cargo'),
	args: ['check', '--workspace', '--quiet'],
	data: cargoInputs,
})

const fuzz = S.Alias(fuzzPkg.all)

// Every PR touching a publishable package needs a changeset; status against
// origin/main is the same check release:check runs.
// `changeset status` validates every pending changeset and that each
// internal dependency names the current version, so the manifests are key
// material beside the changesets. It always diffs against a git base, so
// there are two forms: the branch form diffs against origin/main (the ci
// job checks out full history for it; a developer host has the ref), and
// the candidate form diffs against HEAD, which is what an Agent.Diff
// candidate tree can answer and exactly the changesets the agent added.
const changesetCheck = S.Shell.Test({
	bin: S.NodeModule.Bin('@changesets/cli', 'changeset'),
	args: ['status', '--verbose', '--since=origin/main'],
	data: [changesets, changesetConfig, tree, S.gitDiff()],
})

// A candidate tree (Agent.Diff scratch copy) carries no git repository, so
// the lane form validates from files alone: every pending changeset names
// workspace packages with a valid bump and a summary, and every internal
// dependency uses workspace: or the current version, the rule `changeset
// status` enforces at release time.
const changesetCandidateCheck = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/changeset-candidate.mjs'],
	data: [changesets, changesetConfig, workspaceConfig, tree],
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
	tests: [mechanicalPrePush, scripts.prepareChangesetPublishTest, externalIntegrationTests, agentLints],
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
		scripts.prepareChangesetPublishTest,
		scripts.zigFuzzRunnerTest,
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
	command: 'node scripts/prepare-changeset-publish.mjs --sync-jsr && pnpm install --lockfile-only',
	data: [versionPackages, packageJson, workspaceConfig, S.file('//scripts/prepare-changeset-publish.mjs')],
	changes: ['tevm/jsr.json', 'pnpm-lock.yaml'],
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
	command:
		'if [ -f .changeset/pre.json ]; then pnpm exec changeset pre exit; fi && pnpm exec changeset version --snapshot snapshot && node scripts/prepare-changeset-publish.mjs --sync-jsr && pnpm run release:publish --tag snapshot --no-git-tag',
	data: [allBuilds, allTypes, allDeclarations],
	env: nxEnvironment,
	gates: [ci],
	// Shell targets inherit neither setup-node's npmrc path nor its token variable.
	secrets: [
		S.Secret('NPM_TOKEN'),
		S.Secret('GITHUB_TOKEN'),
		...(process.env.GITHUB_ACTIONS === 'true' ? [S.Secret('NPM_CONFIG_USERCONFIG'), S.Secret('NODE_AUTH_TOKEN')] : []),
	],
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

// Incremental performance benchmarks across every workspace package. Each
// package's `:bench` target is a content-cached Shell.Build capturing
// `artifacts/bench.json` and keyed on its sources, benchmarks, and transitive
// workspace dependencies, so `smthrs target //:bench` only re-runs benchmarks
// affected by a change while restoring unchanged packages from cache.
const benchBaselineFile = S.file('//benchmarks/baseline.json')
const benchReportScript = S.file('//scripts/bench/report.mjs')
const benchShowScript = S.file('//scripts/bench/show-report.mjs')
const benchUpdateBaselineScript = S.file('//scripts/bench/update-baseline.mjs')

const coreBenchSpecs = [
	['packages/actions/artifacts/bench.json', actions.bench],
	['packages/common/artifacts/bench.json', common.bench],
	['packages/contract/artifacts/bench.json', contract.bench],
	['packages/effect/artifacts/bench.json', effectPkg.bench],
	['packages/errors/artifacts/bench.json', errors.bench],
	['packages/http-client/artifacts/bench.json', httpClient.bench],
	['packages/jsonrpc/artifacts/bench.json', jsonrpc.bench],
	['packages/logger/artifacts/bench.json', logger.bench],
	['packages/mcp/artifacts/bench.json', mcp.bench],
	['packages/memory-client/artifacts/bench.json', memoryClient.bench],
	['packages/node/artifacts/bench.json', nodePkg.bench],
	['packages/predeploys/artifacts/bench.json', predeploys.bench],
	['packages/server/artifacts/bench.json', server.bench],
	['packages/utils/artifacts/bench.json', utils.bench],
	['extensions/ethers/artifacts/bench.json', ethersExt.bench],
	['extensions/viem/artifacts/bench.json', viem.bench],
] as const

const bundlerBenchSpecs = [
	['bundler-packages/base-bundler/artifacts/bench.json', baseBundler.bench],
	['bundler-packages/bun/artifacts/bench.json', bunPlugin.bench],
	['bundler-packages/bundler-cache/artifacts/bench.json', bundlerCache.bench],
	['bundler-packages/compiler/artifacts/bench.json', compiler.bench],
	['bundler-packages/config/artifacts/bench.json', config.bench],
	['bundler-packages/esbuild/artifacts/bench.json', esbuildPlugin.bench],
	['bundler-packages/requirejs/artifacts/bench.json', requirejsPlugin.bench],
	['bundler-packages/resolutions/artifacts/bench.json', resolutions.bench],
	['bundler-packages/rollup/artifacts/bench.json', rollupPlugin.bench],
	['bundler-packages/rspack/artifacts/bench.json', rspackPlugin.bench],
	['bundler-packages/runtime/artifacts/bench.json', runtime.bench],
	['bundler-packages/solc/artifacts/bench.json', solcPkg.bench],
	['bundler-packages/tevm-run/artifacts/bench.json', tevmRun.bench],
	['bundler-packages/unplugin/artifacts/bench.json', unplugin.bench],
	['bundler-packages/vite/artifacts/bench.json', vitePlugin.bench],
	['bundler-packages/webpack/artifacts/bench.json', webpackPlugin.bench],
	['bundler-packages/whatsabi/artifacts/bench.json', whatsabi.bench],
] as const

const rustBenchSpecs = [
	['bundler-packages/resolutions-rs/artifacts/bench.json', resolutionsRs.bench],
	['bundler-packages/runtime-rs/artifacts/bench.json', runtimeRs.bench],
	['bundler-packages/solc-rs/artifacts/bench.json', solcRs.bench],
] as const

const toolingBenchSpecs = [
	['lsp/lsp/artifacts/bench.json', lsp.bench],
	['lsp/ts-plugin/artifacts/bench.json', tsPlugin.bench],
	['lsp/vscode/artifacts/bench.json', vscodeExt.bench],
	['cli/artifacts/bench.json', cli.bench],
	['tevm/artifacts/bench.json', tevmFacade.bench],
] as const

const allBenchSpecs = [...coreBenchSpecs, ...bundlerBenchSpecs, ...rustBenchSpecs, ...toolingBenchSpecs] as const

const benchReport = S.Shell.Build({
	bin: S.Runtime.bin,
	args: ['scripts/bench/report.mjs', ...allBenchSpecs.map(([path]) => path)],
	data: [...allBenchSpecs.map(([, target]) => target), benchReportScript, benchBaselineFile],
	outFiles: ['artifacts/benchmarks/report.json', 'artifacts/benchmarks/summary.md', 'artifacts/benchmarks/report.html'],
})

const bench = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['scripts/bench/show-report.mjs'],
	data: [benchReport, benchShowScript],
})

function benchSubset(name: string, specs: ReadonlyArray<(typeof allBenchSpecs)[number]>) {
	const dir = `artifacts/benchmarks/${name}`
	return S.Shell.Build({
		bin: S.Runtime.bin,
		args: ['scripts/bench/report.mjs', ...specs.map(([path]) => path)],
		env: { TEVM_BENCH_REPORT_DIR: dir },
		data: [...specs.map(([, target]) => target), benchReportScript, benchBaselineFile],
		outFiles: [`${dir}/report.json`, `${dir}/summary.md`, `${dir}/report.html`],
	})
}

const benchCore = benchSubset('core', coreBenchSpecs)
const benchBundlers = benchSubset('bundlers', bundlerBenchSpecs)
const benchRust = benchSubset('rust', rustBenchSpecs)
const benchTooling = benchSubset('tooling', toolingBenchSpecs)

const benchBaseline = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['scripts/bench/update-baseline.mjs'],
	data: [benchReport, benchUpdateBaselineScript, benchBaselineFile],
	changes: ['benchmarks/baseline.json'],
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
		bench,
		benchBaseline,
		benchBundlers,
		benchCore,
		benchReport,
		benchRust,
		benchTooling,
		cargoBuilds,
		cargoCheck,
		cargoTests,
		changesetCandidateCheck,
		changesetCheck,
		changesetLint,
		ci,
		clean,
		commit,
		depsLint,
		docsParityLint,
		externalIntegrationTests,
		format,
		fuzz,
		jsdocLint,
		leanSpecs: S.Suite({ tests: [lean.check] }),
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
