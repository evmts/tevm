/// <reference path="../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

const packageJson = S.file("package.json")
const tsconfig = S.file("tsconfig.json")

const srcs = S.Filegroup({
  srcs: S.glob(["src/**"]),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

const compile = S.Shell.Build({
  bin: S.NodeModule.Bin("typescript", "tsc"),
  args: ["--skipLibCheck"],
  data: [srcs, deps, tsconfig],
  outDirs: ["dist"],
})

// The build:app script follows tsc with a cp of the pinned bun lockfile
// into dist; the copy is a first-class target so the compile stays pure.
const lockfileStamp = S.Copy({
  from: S.file("src/utils/bun.lockb"),
  to: "dist/utils/bun.lockb",
})

const build = S.Filegroup({
  srcs: [compile, lockfileStamp],
})

const dev = S.Shell.Run({
  bin: S.NodeModule.Bin("tsx"),
  args: ["src/cli.tsx"],
  data: [srcs, deps],
})

// The upstream test script chains prettier, xo, and ava in one command;
// each is its own target so a formatting diff does not mask a real test
// failure.
const formatCheck = S.Shell.Test({
  bin: S.NodeModule.Bin("prettier"),
  args: ["--check", "."],
  data: [srcs],
})

const lint = S.Shell.Test({
  bin: S.NodeModule.Bin("xo"),
  data: [srcs, packageJson],
})

const testAva = S.Shell.Test({
  bin: S.NodeModule.Bin("ava"),
  data: [srcs, deps, packageJson],
})

const test = S.Suite({
  tests: [formatCheck, lint, testAva],
})

const testCoverage = S.Shell.Test({
  bin: S.NodeModule.Bin("vitest"),
  args: ["run", "--coverage"],
  data: [srcs, deps, build],
  outDirs: ["coverage"],
})

export const Package = S.Package({
  targets: { build, dev, formatCheck, lint, srcs, test, testAva, testCoverage },
})
