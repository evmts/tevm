/// <reference path="./smithers.d.ts" />
const S = Smithers

import { Package as root } from './PACKAGE.js'

const packageJson = S.file('//package.json')
const lockfile = S.file('//pnpm-lock.yaml')
const workspaceConfig = S.file('//pnpm-workspace.yaml')
const cargoLockfile = S.file('//Cargo.lock')

// engines.node (^24) comes from the manifest; .nvmrc pins the exact release
// CI installs. Current Flows accepts one runtime authority, so the graph uses
// the compatible manifest range while factory policy and preflight enforce
// the exact .nvmrc release. flake.nix is not an authority here.
const runtime = S.Runtime.Node({ manifest: packageJson })

// bun is a second runtime, not a package: root and package scripts execute
// through it, several packages test with `bun test`, and two packages preload
// the tevm bun plugin from bunfig.toml. The version is the one
// .github/actions/setup pins. Targets reach it as S.Runtime.Bun.bin.
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

// pnpm workspace membership is part of both the package-manager and installed
// modules declarations. Current Flows does not expose a second Workspaces
// service; package-level dependency fan-out remains represented by the
// existing package targets and the aggregate compatibility gates.

// Cargo targets resolve through the pinned Rust layer. Cargo.toml and
// .cargo/config.toml remain ordinary target inputs, while rust-toolchain.toml
// is the version authority shared by contributors and CI.
const rust = S.Rust.Toolchain({
	toolchain: S.file('//rust-toolchain.toml'),
	lockfile: cargoLockfile,
})

// mise.toml is the version authority for every tool outside Node, pnpm, and
// the Rust layer: bun (the script runner and the test runtime several
// packages use) and foundry (forge and anvil behind the Solidity fixtures
// and the fork services). The package executor installs these pins and
// leads PATH with them before any target resolves a tool, and the generated
// CI setup action does the same through mise-action, so a target sees the
// same release on a runner and on a developer host. Targets name the pinned
// binaries as S.Mise.bin('bun') and S.Mise.bin('forge'); Anvil services find
// anvil on the same PATH. There is no root foundry.toml, so no
// S.Foundry.Toolchain: each fixture declares its own config.
const mise = S.Mise({ config: S.file('//mise.toml') })

// Host binaries this workspace admits beyond the pinned layers. docker runs
// the hive simulator and the docker sandbox; git materializes the vendored
// submodules and clones hive; bash runs the hive and parity shell scripts;
// cargo is the Rust layer's executable for the crates that shell to it;
// python3 runs scripts/claude-triage; code is the VS Code CLI
// //lsp/ts-plugin:dev opens for plugin debugging; codex is the coding-agent
// CLI //evals:evalSuite spawns per case. Undeclared host binaries are a
// graph-load error.
const host = S.Host({
	bins: ['docker', 'git', 'bash', 'cargo', 'python3', 'code', 'codex'],
})

// The agent registry every S.Agent.* target references by name
// (S.Agents.luna, S.Agents.default). Registering here, rather than inline
// per target, makes an engine or model swap one edit and lets the loader
// reject an unknown agent at graph load.
const agents = S.Agents({
	default: S.Agent.Codex({ model: 'gpt-5.6-sol' }),
	luna: S.Agent.Codex({ model: 'gpt-5.6-luna' }),
	reviewPool: S.Agent.Pool(['luna', 'default']),
})

// Sandboxing is the default: a target's process is confined to the workspace
// with no network unless it declares otherwise. The docker sandbox builds the
// repo's own Dockerfile (node 24, rust, bun, zig) for targets that need the
// full native toolchain on a host without it.
const sandboxes = S.Sandboxes({
	default: S.Sandbox.Bubblewrap(),
	docker: S.Sandbox.Docker({ image: 'tevm-factory:local' }),
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
	packageManager,
	nodeModules,
	toolchains: [rust, mise],
	// vendor/flows (the Smithers build source the @smthrs/* link: dependencies
	// resolve through) is the remaining factory dependency; native ZEVM uses siblings.
	// Submodules are
	// gitlinks the repository index pins; //:vendor materializes them.
	// Discovery stops at every .gitmodules path, so their own declaration
	// files never join this graph.
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
