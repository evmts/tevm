/// <reference path="./smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

const packageJson = S.file("//package.json")
const lockfile = S.file("//pnpm-lock.yaml")
const workspaceConfig = S.file("//pnpm-workspace.yaml")
const cargoManifest = S.file("//Cargo.toml")

// package.json declares no engines; flake.nix pins the toolchain for the
// dev shell and is the source of truth for versions.
const runtime = S.Runtime.Node({ version: "24" })

// bun is a second runtime, not a package: root and package scripts execute
// through it and cli/ ships a bun lockfile. Workspace config keys accept
// any layer, so a second runtime composes like the first.
const bun = S.Runtime.Bun({ version: "1.2" })

const packageManager = S.PackageManager.Pnpm({
  manifest: packageJson,
  lockfile,
  workspaces: workspaceConfig,
})

const nodeModules = S.Npm.NodeModules({ packageJson })

// The pnpm workspace package graph as a service. It backs two per-package
// surfaces: S.Npm.WorkspaceDeps({ manifest }) resolves a manifest's
// workspace:* dependencies to their build outputs in topological order,
// which replaces nx's dependsOn ^build:dist edges with ordinary data
// edges, and S.Query({ pattern }) aggregates targets across packages,
// which replaces nx run-many. The nx cache is subsumed by the .flows
// cache.
const workspaces = S.Npm.Workspaces({ config: workspaceConfig })

// The cargo workspace (bundler-packages/*-rs) is a peer toolchain layer:
// S.Cargo.Build and S.Cargo.Test targets resolve their toolchain and
// crate graph through it, keyed on Cargo.lock.
const cargo = S.Cargo.Workspace({ manifest: cargoManifest })

// docker runs the hive simulator; git clones it (test/hive/run-hive.sh).
const host = S.Host({
  bins: ["docker", "git"],
})

export const Workspace = S.Workspace("tevm", {
  repository: "git+https://github.com/evmts/tevm.git",
  cache: S.Cache({ directory: ".flows" }),
  runtime,
  bun,
  packageManager,
  nodeModules,
  workspaces,
  cargo,
  host,
})
