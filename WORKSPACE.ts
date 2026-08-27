/// <reference path="./smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { Package as root } from './PACKAGE.js'

const packageJson = S.file('//package.json')
const lockfile = S.file('//pnpm-lock.yaml')
const workspaceConfig = S.file('//pnpm-workspace.yaml')
const nvmrc = S.file('//.nvmrc')
const cargoManifest = S.file('//Cargo.toml')
const cargoLockfile = S.file('//Cargo.lock')
const cargoConfig = S.file('//.cargo/config.toml')

// engines.node (^24) comes from the manifest; .nvmrc pins the exact release
// CI installs (setup-node reads node-version-file). Both are key material,
// so a runtime bump re-keys every target that spawns node. flake.nix carries
// an older, unpinned dev-shell toolchain and is not an authority here.
const runtime = S.Runtime.Node({ manifest: packageJson, versionFile: nvmrc })

// bun is a second runtime, not a package: root and package scripts execute
// through it, several packages test with `bun test`, and two packages preload
// the tevm bun plugin from bunfig.toml. The version is the one
// .github/actions/setup pins. Targets reach it as S.Runtime.Bun.bin.
const bun = S.Runtime.Bun({ version: '1.2.13' })

// packageManager pins pnpm@10.33.4. pnpm-workspace.yaml carries the package
// globs and onlyBuiltDependencies; passing it makes those graph inputs.
const packageManager = S.PackageManager.Pnpm({
	manifest: packageJson,
	lockfile,
	workspaces: workspaceConfig,
})

const nodeModules = S.Npm.NodeModules({
	packageJson,
	workspaces: workspaceConfig,
})

// The pnpm workspace package graph as a service. It backs two per-package
// surfaces: S.Npm.WorkspaceDeps({ manifest }) resolves a manifest's
// workspace:* dependencies to their build outputs in topological order, which
// replaces nx's dependsOn ^build:dist edges with ordinary data edges, and
// S.Query({ pattern }) aggregates targets across packages, which replaces nx
// run-many. The nx cache is subsumed by the .flows cache.
//
// pnpm-workspace.yaml also lists ../zevm/npm/zevm and ../zevm/npm/platforms/*:
// @evmts/zevm is a workspace member that lives in a sibling checkout outside
// this repository. external maps that member to the //:zevm build target so
// WorkspaceDeps resolves it like any other package; //:zevmCheckout declares
// the clone (SMITHERS-NOTES.md, cross-repo resources).
const workspaces = S.Npm.Workspaces({
	config: workspaceConfig,
	external: { '@evmts/zevm': root.zevm },
})

// The cargo workspace (bundler-packages/*-rs) is a peer toolchain layer:
// S.Cargo.Build, S.Cargo.Test, and S.Cargo.Check targets resolve their
// toolchain and crate graph through it, keyed on Cargo.lock. .cargo/config.toml
// redirects target-dir to dist/target, which every crate's outDirs reflects.
// CI installs stable with rustfmt and clippy plus cbindgen.
const cargo = S.Cargo.Workspace({
	manifest: cargoManifest,
	lockfile: cargoLockfile,
	config: cargoConfig,
	components: ['rustfmt', 'clippy'],
})

// forge and anvil back the Solidity fixtures (examples/vite, examples/esbuild,
// lsp/ts-plugin, test/test-utils) and the anvil fork services. CI pins
// foundry v1.7.1 through foundry-toolchain.
const foundry = S.Foundry.Toolchain({ version: 'v1.7.1' })

// Host binaries this workspace admits. docker runs the hive simulator and the
// docker sandbox; git clones hive and the zevm sibling; bash runs the hive
// and parity shell scripts; forge and anvil are the foundry binaries the
// toolchain layer above pins, named here for the targets that invoke them
// as host tools; python3 runs scripts/claude-triage; code is the VS Code CLI
// //lsp/ts-plugin:dev opens for plugin debugging; codex is the coding-agent
// CLI //evals:evalSuite spawns per case. Undeclared host binaries are a
// graph-load error.
const host = S.Host({
	bins: ['docker', 'git', 'bash', 'forge', 'anvil', 'python3', 'code', 'codex'],
})

// The agent registry every S.Agent.* target references by name
// (S.Agents.luna, S.Agents.default). Registering here, rather than inline
// per target, makes an engine or model swap one edit and lets the loader
// reject an unknown agent at graph load.
const agents = S.Agents({
	default: S.Agent.ClaudeCode({ model: 'claude-fable-5' }),
	luna: S.Agent.Codex({ model: 'luna' }),
	reviewPool: S.Agent.Pool(['luna', 'default']),
})

// Sandboxing is the default: a target's process is confined to the workspace
// with no network unless it declares otherwise. The docker sandbox builds the
// repo's own Dockerfile (node 24, rust, bun, zig) for targets that need the
// full native toolchain on a host without it.
const sandboxes = S.Sandboxes({
	default: S.Sandbox.Bubblewrap(),
	docker: S.Sandbox.Docker({ dockerfile: S.file('//Dockerfile') }),
})

// Cross-run memory: commits retained by //:retainCommit and facts agents
// record land in the repo bank, and the five most relevant are injected into
// every agent target's prompt.
const memory = S.Memory.SmithersCloud({
	bank: ['repo'],
	autoInject: 5,
})

export const Workspace = S.Workspace('tevm', {
	repository: 'git+https://github.com/evmts/tevm.git',
	// The remote cache replaces Nx Cloud (nx.json nxCloudAccessToken): CI
	// and contributors share content-keyed results. Read and write are split
	// secrets so a fork PR can read without being able to poison the store.
	cache: S.Cache({
		directory: '.flows',
		remote: S.RemoteCache.make({
			endpoint: 'https://build.smithers.sh',
			read: S.Secret('SMITHERS_CACHE_READ_TOKEN'),
			write: S.Secret('SMITHERS_CACHE_WRITE_TOKEN'),
		}),
	}),
	runtime,
	bun,
	packageManager,
	nodeModules,
	workspaces,
	cargo,
	foundry,
	host,
	agents,
	sandboxes,
	memory,
	// Git hooks bind to the same target objects the index labels, so the
	// pre-commit and pre-push checks are the suites CI runs, not a second
	// definition of them. Replaces the husky setup scripts/husky.md describes.
	gitHooks: {
		preCommit: root.preCommit,
		postCommit: root.postCommit,
		prePush: root.prePush,
	},
})
