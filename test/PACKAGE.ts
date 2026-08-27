/// <reference path="../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// Conformance against the canonical Ethereum test suites. The fixture
// corpora are external repositories pinned by rev: S.Git.Checkout is the
// http_archive of this workspace, a content-addressed external input that
// downloads once per rev and never at test time.
const ethereumTests = S.Git.Checkout({
  repository: "https://github.com/ethereum/tests.git",
  rev: "v17.1",
})

const executionSpecTests = S.Git.Checkout({
  repository: "https://github.com/ethereum/execution-spec-tests.git",
  rev: "v4.5.0",
})

const runners = S.Filegroup({
  srcs: S.glob([
    "conformance-utils/**",
    "eip3155/**",
    "ethereum-state-tests/**",
    "execution-spec-tests/**",
  ]),
})

// The runners execute the built EVM, not sources. Query aggregates the
// build targets of every packages/* package without this file importing
// each Package; a pattern settles to a target set anywhere a data or
// suite slot takes targets.
const built = S.Query({ pattern: "//packages/**:build" })

const gstFast = S.Shell.Test({
  bin: S.Runtime.bin,
  args: [
    "test/ethereum-state-tests/run-general-state-tests.mjs",
    "--group=boundary",
    "--hardfork=frontier",
    "--limit=50",
    "--out=artifacts/general-state-tests/boundary-frontier.json",
  ],
  data: [runners, built, ethereumTests],
  outDirs: ["../artifacts/general-state-tests"],
})

const gstAll = S.Shell.Test({
  bin: S.Runtime.bin,
  args: [
    "test/ethereum-state-tests/run-general-state-tests.mjs",
    "--out=artifacts/general-state-tests/all.json",
  ],
  data: [runners, built, ethereumTests],
  outDirs: ["../artifacts/general-state-tests"],
})

const execSpecFast = S.Shell.Test({
  bin: S.Runtime.bin,
  args: [
    "test/execution-spec-tests/run-execution-spec-tests.mjs",
    "--group=eip",
    "--hardfork=shanghai",
    "--limit=50",
    "--out=artifacts/execution-spec-tests/eip-shanghai.json",
  ],
  data: [runners, built, executionSpecTests],
  outDirs: ["../artifacts/execution-spec-tests"],
})

const execSpecAll = S.Shell.Test({
  bin: S.Runtime.bin,
  args: [
    "test/execution-spec-tests/run-execution-spec-tests.mjs",
    "--out=artifacts/execution-spec-tests/all.json",
  ],
  data: [runners, built, executionSpecTests],
  outDirs: ["../artifacts/execution-spec-tests"],
})

// EIP-3155 trace comparison against a reference client trace. This is the
// debugging tool conformance failures reduce to: opcode-level divergence
// instead of a failing state root.
const traceCompare = S.Shell.Test({
  bin: S.Runtime.bin,
  args: [
    "test/ethereum-state-tests/run-general-state-tests.mjs",
    "--group=eip",
    "--trace-out=artifacts/general-state-tests/actual-trace.json",
    "--trace-compare=true",
    "--trace-reference=artifacts/general-state-tests/reference-trace.json",
    "--trace-diff-out=artifacts/eip3155/trace-diff.json",
    "--out=artifacts/general-state-tests/trace-compare.json",
  ],
  data: [runners, built, ethereumTests],
  outDirs: ["../artifacts/general-state-tests", "../artifacts/eip3155"],
})

const conformanceFast = S.Suite({
  tests: [gstFast, execSpecFast],
})

const conformanceAll = S.Suite({
  tests: [gstAll, execSpecAll],
})

// hive drives the tevm node over docker as a black-box execution client.
// sandbox.docker admits the host docker daemon into the sandbox; git
// clones the simulator (test/hive/run-hive.sh).
const hiveSmoke = S.Shell.Test({
  script: S.file("hive/run-hive.sh"),
  env: { HIVE_SUITE: "smoke" },
  data: [S.Filegroup({ srcs: S.glob(["hive/**"]) }), built],
  sandbox: { network: true, docker: true },
})

const hiveRpcCompat = S.Shell.Test({
  script: S.file("hive/run-hive.sh"),
  env: { HIVE_SUITE: "rpc-compat" },
  data: [S.Filegroup({ srcs: S.glob(["hive/**"]) }), built],
  sandbox: { network: true, docker: true },
})

const parityFast = S.Shell.Test({
  script: S.file("//scripts/parity/run-suite.sh"),
  args: ["fast"],
  data: [built],
  outDirs: ["../artifacts/parity"],
})

const parityFull = S.Shell.Test({
  script: S.file("//scripts/parity/run-suite.sh"),
  args: ["full"],
  data: [built],
  outDirs: ["../artifacts/parity"],
})

const bench = S.Shell.Run({
  bin: S.NodeModule.Bin("vitest"),
  args: ["bench", "--run"],
  data: [S.Filegroup({ srcs: S.glob(["bench/**"]) }), built],
})

export const Package = S.Package({
  targets: {
    bench,
    conformanceAll,
    conformanceFast,
    execSpecAll,
    execSpecFast,
    gstAll,
    gstFast,
    hiveRpcCompat,
    hiveSmoke,
    parityFast,
    parityFull,
    traceCompare,
  },
})
