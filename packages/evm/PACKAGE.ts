/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// Exemplar for the packages/* library shape. The other ~30 packages under
// packages/ (block, blockchain, common, tx, vm, and so on) follow this
// file target-for-target; only manifests, config filenames, and the extras
// noted in sibling PACKAGE.ts files differ.
const packageJson = S.file("package.json")
const tsconfig = S.file("tsconfig.json")
const tsupConfig = S.file("tsup.config.js")
const typedocConfig = S.file("typedoc.json")
const vitestConfig = S.file("vitest.config.ts")

const srcs = S.Filegroup({
  srcs: S.glob(["src/**"]),
})

// Workspace dependencies as data: the built outputs of every workspace:*
// dependency in this manifest, in topological order. This is the nx
// dependsOn ^build:dist edge expressed as an ordinary dependency, so a
// change in an upstream package rebuilds it before this package's targets
// run, and an unrelated upstream change is a cache hit.
const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

const build = S.Shell.Build({
  bin: S.NodeModule.Bin("tsup"),
  data: [srcs, deps, tsupConfig, tsconfig],
  outDirs: ["dist"],
})

const types = S.Shell.Build({
  bin: S.NodeModule.Bin("tsup"),
  args: ["--dts-only"],
  data: [srcs, deps, tsupConfig, tsconfig],
  outDirs: ["dist"],
})

const typecheck = S.Shell.Test({
  bin: S.NodeModule.Bin("typescript", "tsc"),
  args: ["--noEmit"],
  data: [srcs, deps, tsconfig],
})

const test = S.Shell.Test({
  bin: S.NodeModule.Bin("vitest"),
  args: ["run"],
  data: [srcs, deps, vitestConfig, tsconfig],
})

// Coverage is a gate, not a report to eyeball: the test run emits the
// v8 coverage directory and the gate fails below the floor. Thresholds
// live here instead of vitest config so the graph shows what CI enforces.
const testCoverage = S.Shell.Test({
  bin: S.NodeModule.Bin("vitest"),
  args: ["run", "--coverage"],
  data: [srcs, deps, vitestConfig, tsconfig],
  outDirs: ["coverage"],
})

const coverageGate = S.Coverage.Gate({
  report: testCoverage,
  thresholds: { statements: 85, branches: 80 },
})

const docs = S.Shell.Build({
  bin: S.NodeModule.Bin("typedoc"),
  data: [srcs, typedocConfig, packageJson],
  outDirs: ["docs"],
})

const pack = S.Npm.Pack({
  manifest: packageJson,
  data: [build, types, srcs],
})

// publint and attw run against the packed tarball, not the source tree,
// so packaging correctness (exports map, dual emit, type resolution under
// every moduleResolution) is checked on what npm consumers actually get.
// Replaces the lint:package script.
const packageLint = S.Npm.PackageLint({ pack })

const depsLint = S.Shell.Test({
  bin: S.Runtime.npx("depcheck"),
  data: [srcs, packageJson],
})

export const Package = S.Package({
  targets: {
    build,
    coverageGate,
    depsLint,
    docs,
    pack,
    packageLint,
    srcs,
    test,
    testCoverage,
    typecheck,
    types,
  },
})
