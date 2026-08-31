/// <reference path="./smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// PACKAGE.ts files are discovered automatically: the CLI globs the tree and
// indexes each file's Package export under path-derived labels
// (//packages/evm:test, //test:conformanceFast, //:lint). Only targets
// passed to S.Package are public; consts that stay out of the map are
// private to this file. This root file holds tree-wide targets; per-package
// targets live beside their packages, and Query patterns aggregate them
// without central imports.
const packageJson = S.file("//package.json")
const lockfile = S.file("//pnpm-lock.yaml")
const biomeConfig = S.file("//biome.json")

const tree = S.Filegroup({
  srcs: S.glob([
    "**/*.{ts,tsx,js,mjs,json,md}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/.nx/**",
  ]),
})

const lint = S.Shell.Test({
  bin: S.NodeModule.Bin("@biomejs/biome"),
  args: ["check", "."],
  data: [tree, biomeConfig],
})

const format = S.Shell.Diff({
  bin: S.NodeModule.Bin("@biomejs/biome"),
  args: ["format", ".", "--write"],
  data: [tree, biomeConfig],
  changes: ["**"],
})

// Manifest hygiene as Generate: check fails on unsorted package.json
// files, --write sorts them. Replaces the sort-package-json scripts.
const sortManifests = S.Generate({
  bin: S.Runtime.npx("sort-package-json"),
  args: [
    "package.json",
    "bundler-packages/*/package.json",
    "configs/*/package.json",
    "examples/*/package.json",
    "extensions/*/package.json",
    "packages/*/package.json",
    "tevm/package.json",
  ],
  data: [tree],
  changes: ["**/package.json"],
})

const depsLint = S.Shell.Test({
  bin: S.Runtime.npx("depcheck"),
  data: [packageJson, lockfile],
})

// Query aggregation replaces nx run-many: a pattern settles to the set of
// public targets whose label matches, so tree-wide suites do not import
// every Package and new packages join CI by existing.
const allTypechecks = S.Query({ pattern: "//**:typecheck" })

const allTests = S.Query({ pattern: "//**:test" })

const allBuilds = S.Query({ pattern: "//**:build" })

const allPackageLints = S.Query({ pattern: "//**:packageLint" })

const allCoverage = S.Query({ pattern: "//**:coverageGate" })

const cargoTests = S.Query({ pattern: "//bundler-packages/**:testRust" })

// Every PR touching a publishable package needs a changeset; status
// against origin/main is the same check release:check runs.
const changesetCheck = S.Shell.Test({
  bin: S.NodeModule.Bin("@changesets/cli", "changeset"),
  args: ["status", "--verbose", "--since=origin/main"],
  data: [S.Filegroup({ srcs: S.glob([".changeset/**"]) }), S.gitDiff()],
})

// Agentic lint over the diff: exported symbols need JSDoc that typedoc can
// render. Grounds the scripts/jsdoc-helper tooling as a lint with a fix
// verb instead of a batch script.
const jsdocLint = S.Agent.Lint({
  agent: S.Agent.Codex("luna"),
  prompt: S.file("//workflows/lints/jsdoc.md"),
  data: [S.gitDiff({ paths: ["packages/**/src/**", "bundler-packages/**/src/**"] })],
  fixes: ["packages/**/src/**", "bundler-packages/**/src/**"],
})

// The claude-code-review.yml checklist as a target: the same review,
// runnable locally before pushing.
const prReview = S.Agent.Lint({
  agent: S.Agent.Codex("luna"),
  prompt: S.file("//.github/workflows/claude-code-review.yml"),
  data: [S.gitDiff()],
})

// Filegroup groups files, Suite groups tests, Alias renames one target. A
// dependency edge always means "materialize files", never "execute".
const preCommit = S.Suite({
  tests: [lint, changesetCheck],
})

const prePush = S.Suite({
  tests: [lint, allTypechecks, allTests, jsdocLint],
})

const ci = S.Suite({
  tests: [
    lint,
    sortManifests,
    allTypechecks,
    allTests,
    allCoverage,
    allPackageLints,
    cargoTests,
    changesetCheck,
  ],
})

// changesets owns versioning: version applies pending changesets to
// manifests and changelogs (a Diff over the tree), publish builds
// everything and pushes each bumped package to npm with provenance. The
// per-package apiCompat gates prove the chosen bumps cover the real API
// deltas before anything is public.
const version = S.Changesets.Version({
  data: [S.Filegroup({ srcs: S.glob([".changeset/**"]) })],
  changes: ["**/package.json", "**/CHANGELOG.md", ".changeset/**", "pnpm-lock.yaml"],
})

const publish = S.Changesets.Publish({
  gates: [ci, S.Query({ pattern: "//**:apiCompat" })],
  data: [allBuilds],
  provenance: true,
  secrets: [S.Secret("NPM_TOKEN")],
  sandbox: { network: true },
  approval: "required",
})

const commit = S.Git.Commit({
  gates: [preCommit],
  message: S.Agent.Codex("luna"),
})

const pr = S.Git.Pr({
  gates: [prePush],
  secrets: [S.Secret("GITHUB_TOKEN")],
  sandbox: { network: true },
})

// The .github/workflows files are emitted from the graph: each entry maps
// a trigger to a target and the generator writes the actions boilerplate
// from the workspace layers. Check fails on drift; --write regenerates.
// Replaces ci.yml, release.yml, jsr-publish.yml, wasm-size-check.yml, and
// parity-suites.yml.
const githubCi = S.Github.Ci({
  workflows: {
    ci: { on: { push: ["main"], pullRequest: true, dispatch: true }, run: ci },
    release: { on: { push: ["main"] }, run: publish },
    jsrPublish: {
      on: { push: ["main"] },
      run: S.Query({ pattern: "//tevm:publishJsr" }),
    },
    wasmSize: {
      on: { pullRequest: true },
      run: S.Query({ pattern: "//bundler-packages/**:wasmSize" }),
    },
    paritySuites: {
      on: { dispatch: true },
      run: S.Query({ pattern: "//test:parityFull" }),
    },
  },
  changes: [".github/workflows/**"],
})

// Full conformance is too slow for every PR, so it runs nightly; failures
// arrive as the conformance-triage workflow's input rather than a red PR.
const nightlyConformance = S.Cron({
  schedule: "0 3 * * *",
  run: [S.Query({ pattern: "//test:conformanceAll" })],
})

export const Package = S.Package({
  defaultVisibility: "public",
  targets: {
    changesetCheck,
    ci,
    commit,
    depsLint,
    format,
    githubCi,
    jsdocLint,
    lint,
    nightlyConformance,
    pr,
    prReview,
    preCommit,
    prePush,
    publish,
    sortManifests,
    version,
  },
})
