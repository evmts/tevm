/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// Exemplar for the bundler-packages/* plugin shape (esbuild, rollup,
// rspack, webpack, bun, unplugin, and the rest follow this file). Each
// wraps the shared base-bundler over one bundler's plugin interface, so
// the target list is the standard library shape.
const packageJson = S.file("package.json")
const tsconfig = S.file("tsconfig.json")
const tsupConfig = S.file("tsup.config.js")
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

const pack = S.Npm.Pack({
  manifest: packageJson,
  data: [build, types, srcs],
})

const packageLint = S.Npm.PackageLint({ pack })

export const Package = S.Package({
  targets: { build, pack, packageLint, srcs, test, typecheck, types },
})
