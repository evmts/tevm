/// <reference path="../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// The tevm meta package: re-exports every packages/* entrypoint and, unlike
// them, commits its emit so npm and JSR publish from the tree.
const packageJson = S.file("package.json")
const tsconfig = S.file("tsconfig.json")
const tsupConfig = S.file("tsup.config.js")
const typedocConfig = S.file("typedoc.json")
const jsrJson = S.file("//jsr.json")

const srcs = S.Filegroup({
  srcs: S.glob(["**/*.ts", "!**/*.d.ts", "!**/*.spec.ts", "!node_modules/**"]),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// The emit is committed generated output. Upstream, build:dist runs tsup
// and then `git status --porcelain` to fail on drift; Generate is that
// contract as a verb: check regenerates and fails on drift, --write
// updates the tree for commit.
const dist = S.Generate({
  bin: S.NodeModule.Bin("tsup"),
  data: [srcs, deps, tsupConfig, tsconfig],
  changes: ["**/*.js", "**/*.cjs", "**/*.d.ts", "**/*.d.cts", "**/*.map"],
})

const typecheck = S.Shell.Test({
  bin: S.NodeModule.Bin("typescript", "tsc"),
  args: ["--noEmit"],
  data: [srcs, deps, tsconfig],
})

const docs = S.Shell.Build({
  bin: S.NodeModule.Bin("typedoc"),
  data: [srcs, typedocConfig, packageJson],
  outDirs: ["docs"],
})

const pack = S.Npm.Pack({
  manifest: packageJson,
  data: [srcs, dist],
})

const packageLint = S.Npm.PackageLint({ pack })

// JSR is a second registry with its own manifest (jsr.json) and its own
// auth model (OIDC from CI, interactive locally). Publishing is outward,
// so it declares approval; the changesets flow on the root package invokes
// this target after the npm publish.
const publishJsr = S.Jsr.Publish({
  manifest: jsrJson,
  data: [srcs, dist],
  gates: [typecheck, packageLint],
  sandbox: { network: true },
  approval: "required",
})

export const Package = S.Package({
  targets: {
    dist,
    docs,
    pack,
    packageLint,
    publishJsr,
    srcs,
    typecheck,
  },
})
