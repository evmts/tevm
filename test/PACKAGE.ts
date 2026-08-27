/// <reference path="../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// Conformance against the canonical Ethereum test suites, the EIP-3155 trace
// tooling, hive, and the parity suites: the root package.json's test:* scripts
// as targets. The workspace packages under test/* (bench, test-utils, the
// integration suites) have their own PACKAGE.ts files.

// The fixture corpora are external repositories pinned by rev: S.Git.Checkout
// is the http_archive of this workspace, a content-addressed external input
// that downloads once per rev and never at test time.
const ethereumTests = S.Git.Checkout({
	repository: 'https://github.com/ethereum/tests.git',
	rev: 'v17.1',
})

const executionSpecTests = S.Git.Checkout({
	repository: 'https://github.com/ethereum/execution-spec-tests.git',
	rev: 'v4.5.0',
})

const runners = S.Filegroup({
	srcs: S.glob([
		'conformance-utils/**',
		'ethereum-state-tests/**',
		'execution-spec-tests/**',
		'hardfork-conformance/**',
	]),
})

const traceTools = S.Filegroup({
	srcs: S.glob(['eip3155/**']),
})

const hive = S.Filegroup({
	srcs: S.glob(['hive/**', '!hive/artifacts/**']),
})

// The shared vitest matchers packages/actions and others load as a setup
// file; declared here so those packages can reference //test:vitestMatchers.
const vitestMatchers = S.Filegroup({
	srcs: S.glob(['vitest-matchers/**']),
})

// The runners execute the built EVM, not sources. Query aggregates the build
// targets of every packages/* package without this file importing each
// Package; a pattern settles to a target set anywhere a data or suite slot
// takes targets.
const built = S.Query({ pattern: '//packages/**:build' })

// test:conformance:targets: the hardfork/group matrix the runners iterate.
const conformanceTargets = S.Shell.Build({
	bin: S.Runtime.bin,
	args: [
		'test/conformance-utils/generate-target-groups.mjs',
		'--out=artifacts/conformance-target-groups/frontier-osaka.json',
	],
	data: [runners],
	outDirs: ['../artifacts/conformance-target-groups'],
})

// test:conformance:gst: the fast subset (boundary group, frontier, 50 cases).
const gstFast = S.Shell.Test({
	bin: S.Runtime.bin,
	args: [
		'test/ethereum-state-tests/run-general-state-tests.mjs',
		'--group=boundary',
		'--hardfork=frontier',
		'--limit=50',
		'--out=artifacts/general-state-tests/boundary-frontier.json',
	],
	data: [runners, built, ethereumTests],
	outDirs: ['../artifacts/general-state-tests'],
})

// test:conformance:gst:all.
const gstAll = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['test/ethereum-state-tests/run-general-state-tests.mjs', '--out=artifacts/general-state-tests/all.json'],
	data: [runners, built, ethereumTests],
	outDirs: ['../artifacts/general-state-tests'],
})

// test:conformance:gst:isolate: one fixture with a trace, the first step of
// a triage. The script hard-codes the id; the conformance-triage lane passes
// its own through the same flag.
const gstIsolate = S.Shell.Run({
	bin: S.Runtime.bin,
	args: [
		'test/ethereum-state-tests/run-general-state-tests.mjs',
		'--isolate=gst-frontier-upstream-state-root',
		'--trace-out=artifacts/general-state-tests/isolate-trace.json',
		'--out=artifacts/general-state-tests/isolate.json',
	],
	data: [runners, built, ethereumTests],
})

// test:conformance:execspec: the fast subset (eip group, shanghai, 50 cases).
const execSpecFast = S.Shell.Test({
	bin: S.Runtime.bin,
	args: [
		'test/execution-spec-tests/run-execution-spec-tests.mjs',
		'--group=eip',
		'--hardfork=shanghai',
		'--limit=50',
		'--out=artifacts/execution-spec-tests/eip-shanghai.json',
	],
	data: [runners, built, executionSpecTests],
	outDirs: ['../artifacts/execution-spec-tests'],
})

// test:conformance:execspec:all.
const execSpecAll = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['test/execution-spec-tests/run-execution-spec-tests.mjs', '--out=artifacts/execution-spec-tests/all.json'],
	data: [runners, built, executionSpecTests],
	outDirs: ['../artifacts/execution-spec-tests'],
})

// test:conformance:execspec:isolate.
const execSpecIsolate = S.Shell.Run({
	bin: S.Runtime.bin,
	args: [
		'test/execution-spec-tests/run-execution-spec-tests.mjs',
		'--isolate=est-shanghai-eip4895-header-validation',
		'--trace-out=artifacts/execution-spec-tests/isolate-trace.json',
		'--out=artifacts/execution-spec-tests/isolate.json',
	],
	data: [runners, built, executionSpecTests],
})

// test:conformance:gst:trace:compare: EIP-3155 trace comparison against a
// reference client trace. This is the debugging tool conformance failures
// reduce to: opcode-level divergence instead of a failing state root.
const traceCompare = S.Shell.Test({
	bin: S.Runtime.bin,
	args: [
		'test/ethereum-state-tests/run-general-state-tests.mjs',
		'--group=eip',
		'--trace-out=artifacts/general-state-tests/actual-trace.json',
		'--trace-compare=true',
		'--trace-reference=artifacts/general-state-tests/reference-trace.json',
		'--trace-diff-out=artifacts/eip3155/trace-diff.json',
		'--out=artifacts/general-state-tests/trace-compare.json',
	],
	data: [runners, traceTools, built, ethereumTests],
	outDirs: ['../artifacts/general-state-tests', '../artifacts/eip3155'],
})

// test:eip3155: the trace tools' own unit tests (node --test).
const traceToolsTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'test/eip3155/trace-tools.test.mjs'],
	data: [traceTools],
})

// test:eip3155:convert and test:eip3155:compare: the trace tools as commands
// over files under artifacts/.
const traceConvert = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['test/eip3155/trace-tools.mjs', 'convert'],
	data: [traceTools],
})

const traceCompareTool = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['test/eip3155/trace-tools.mjs', 'compare'],
	data: [traceTools],
})

// test:conformance:fast and test:conformance:all.
const conformanceFast = S.Suite({
	tests: [gstFast, execSpecFast],
})

const conformanceAll = S.Suite({
	tests: [gstAll, execSpecAll],
})

// hive drives the tevm node over docker as a black-box execution client
// (test/hive/run-hive.sh clones the simulator and builds the client image
// from test/hive/client). sandbox.docker admits the host docker daemon into
// the sandbox; git clones hive. The *:smithers:* script variants only add
// HIVE_ARTIFACT_DIR, which is the outDirs declaration here.
const hiveSmoke = S.Shell.Test({
	script: S.file('hive/run-hive.sh'),
	env: { HIVE_SUITE: 'smoke', HIVE_ARTIFACT_DIR: 'artifacts/hive' },
	data: [hive, built],
	sandbox: { network: true, docker: true },
	outDirs: ['../artifacts/hive', 'hive/artifacts'],
})

const hiveRpcCompat = S.Shell.Test({
	script: S.file('hive/run-hive.sh'),
	env: { HIVE_SUITE: 'rpc-compat', HIVE_ARTIFACT_DIR: 'artifacts/hive' },
	data: [hive, built],
	sandbox: { network: true, docker: true },
	outDirs: ['../artifacts/hive', 'hive/artifacts'],
})

// test:parity:fast and test:parity:full (scripts/parity/run-suite.sh). The
// fast suite is the RPC subset parity-suites.yml runs on every PR; full adds
// the complete state-test and execution-spec corpora and hive rpc-compat.
// PARITY_ARTIFACT_DIR from the *:rpc and *:smithers:* variants is the outDirs
// declaration.
const parityFast = S.Shell.Test({
	script: S.file('//scripts/parity/run-suite.sh'),
	args: ['fast'],
	env: { PARITY_ARTIFACT_DIR: 'artifacts/parity' },
	data: [S.file('//scripts/parity/run-suite.sh'), runners, built, ethereumTests, executionSpecTests],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
	outDirs: ['../artifacts/parity'],
})

const parityFull = S.Shell.Test({
	script: S.file('//scripts/parity/run-suite.sh'),
	args: ['full'],
	env: { PARITY_ARTIFACT_DIR: 'artifacts/parity' },
	data: [S.file('//scripts/parity/run-suite.sh'), runners, hive, built, ethereumTests, executionSpecTests],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true, docker: true },
	outDirs: ['../artifacts/parity'],
})

// Everything the runners write under artifacts/.
const clean = S.Clean({
	targets: [gstAll, execSpecAll, traceCompare, hiveSmoke, parityFull, conformanceTargets],
	paths: ['../artifacts', 'hive/artifacts'],
})

export const Package = S.Package({
	targets: {
		clean,
		conformanceAll,
		conformanceFast,
		conformanceTargets,
		execSpecAll,
		execSpecFast,
		execSpecIsolate,
		gstAll,
		gstFast,
		gstIsolate,
		hiveRpcCompat,
		hiveSmoke,
		parityFast,
		parityFull,
		traceCompare,
		traceCompareTool,
		traceConvert,
		traceToolsTest,
		vitestMatchers,
	},
})
