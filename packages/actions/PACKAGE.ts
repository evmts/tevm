/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// packages/evm/PACKAGE.ts is the exemplar for the common shape; this file
// adds the api-compat gate, because actions is the largest public surface
// (every tevm_* and eth_* handler) and the most common source of
// accidental breaking changes.
const packageJson = S.file("package.json")
const tsconfig = S.file("tsconfig.json")
const tsupConfig = S.file("tsup.config.ts")
const vitestConfig = S.file("vitest.config.ts")

const srcs = S.Filegroup({
  srcs: S.glob(["src/**"]),
})

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

// Semver as a gate, per package: baseline is the last published
// @tevm/actions declarations from the registry, surface is this tree's
// emit. changesets picks the bump; this target proves the bump covers the
// actual API delta.
const apiCompat = S.Api.Compat({
  baseline: S.Npm.Published({ manifest: packageJson }),
  surface: types,
  manifest: packageJson,
})

const pack = S.Npm.Pack({
  manifest: packageJson,
  data: [build, types, srcs],
})

const packageLint = S.Npm.PackageLint({ pack })

export const Package = S.Package({
  targets: {
    apiCompat,
    build,
    pack,
    packageLint,
    srcs,
    test,
    typecheck,
    types,
  },
})
