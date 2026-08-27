/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// packages/evm/PACKAGE.ts is the exemplar for the common shape; this file
// adds the fork-state extras: tests that fork live networks through the
// RPC URLs CI injects.
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

// Hermetic tests run without network. Fork tests hit live mainnet and
// optimism RPC endpoints, so they are a separate target with the network
// sandbox and the same secrets ci.yml injects; a flaky provider cannot
// fail the hermetic suite.
const test = S.Shell.Test({
  bin: S.NodeModule.Bin("vitest"),
  args: ["run", "--exclude", "**/*fork*"],
  data: [srcs, deps, vitestConfig, tsconfig],
})

const testFork = S.Shell.Test({
  bin: S.NodeModule.Bin("vitest"),
  args: ["run", "src/**/*fork*"],
  data: [srcs, deps, vitestConfig, tsconfig],
  secrets: [
    S.Secret("TEVM_TEST_ALCHEMY_KEY"),
    S.Secret("TEVM_RPC_URLS_MAINNET"),
    S.Secret("TEVM_RPC_URLS_OPTIMISM"),
  ],
  sandbox: { network: true },
})

const pack = S.Npm.Pack({
  manifest: packageJson,
  data: [build, types, srcs],
})

const packageLint = S.Npm.PackageLint({ pack })

export const Package = S.Package({
  targets: {
    build,
    pack,
    packageLint,
    srcs,
    test,
    testFork,
    typecheck,
    types,
  },
})
