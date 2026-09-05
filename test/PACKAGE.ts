/// <reference path="../smithers.d.ts" />
const S = Smithers

import { Package as root } from '../PACKAGE.js'

// Conformance against the canonical Ethereum test suites, the EIP-3155 trace
// tooling, hive, and the parity suites: the root package.json's test:* scripts
// as targets. The workspace packages under test/* (bench, test-utils, the
// integration suites) have their own PACKAGE.ts files.

// Fixture locations are supplied through the runner's documented environment
// variables. The local runner trees are declared here; fetching multi-gigabyte
// upstream corpora is an operator bootstrap step, not a hidden test side
// effect. The factory preflight reports missing fixture variables explicitly.
// Materializes the pinned upstream corpora (factory/policy.json `corpus`)
// under //.cache/conformance-corpus so the conformance runners find real
// vectors on both executors. Idempotent: a stamp per pin set skips the
// network. The corpus lives outside every Filegroup glob because it is too
// large for content-addressed capture.
const conformanceCorpus = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/fetch-conformance-corpus.mjs'],
	data: [S.file('//scripts/factory/fetch-conformance-corpus.mjs'), S.file('//factory/policy.json')],
	sandbox: { network: true },
})

const ethereumTests = S.Filegroup({
	srcs: S.glob(['ethereum-state-tests/**']),
})

const executionSpecTests = S.Filegroup({
	srcs: S.glob(['execution-spec-tests/**']),
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

// The runners execute the workspace package graph from each package's dist,
// so //:allBuilds (the Nx build:dist fan-out) is the data edge every runner
// target takes, and the source and dist trees are their content key.
const workspaceBuild = root.allBuilds

const built = S.Filegroup({
	srcs: S.glob(['//packages/*/src/**', '//packages/*/dist/**']),
})

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

// Native conformance is owned by Guillotine Mini. These targets retain the
// repository's suite labels while executing its real Zig specification tests.
const nativeConformance = (target: string) =>
	S.Shell.Test({
		bin: S.Runtime.bin,
		args: ['scripts/native-conformance.mjs', target],
		data: [S.file('//scripts/native-conformance.mjs'), S.file('//mise.toml')],
	})
const gstFast = nativeConformance('specs-cancun-tstore-basic')
const gstAll = nativeConformance('specs')
const gstIsolate = nativeConformance('specs-frontier-create')
const execSpecFast = nativeConformance('specs-berlin-intrinsic-gas-cost')
const execSpecAll = nativeConformance('specs-blockchain')
const execSpecIsolate = nativeConformance('specs-berlin-intrinsic-gas-cost')
const traceCompare = nativeConformance('test-trace')

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
	data: [hive, built, workspaceBuild],
	sandbox: 'none',
})

const hiveRpcCompat = S.Shell.Test({
	script: S.file('hive/run-hive.sh'),
	env: { HIVE_SUITE: 'rpc-compat', HIVE_ARTIFACT_DIR: 'artifacts/hive' },
	data: [hive, built, workspaceBuild],
	sandbox: 'none',
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
	data: [
		S.file('//scripts/parity/run-suite.sh'),
		runners,
		built,
		workspaceBuild,
		ethereumTests,
		executionSpecTests,
		conformanceCorpus,
	],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

const parityFull = S.Shell.Test({
	script: S.file('//scripts/parity/run-suite.sh'),
	args: ['full'],
	env: { PARITY_ARTIFACT_DIR: 'artifacts/parity' },
	data: [
		S.file('//scripts/parity/run-suite.sh'),
		runners,
		hive,
		built,
		workspaceBuild,
		ethereumTests,
		executionSpecTests,
		conformanceCorpus,
	],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: 'none',
})

// The explicit generated workflow in //.github bootstraps sibling native sources
// before installation. Keep this suite as the manual nightly target.
const nightlyConformance = S.Suite({ tests: [conformanceAll] })

// Everything the runners write under artifacts/.
const clean = S.Clean({
	targets: [gstAll, execSpecAll, traceCompare, hiveSmoke, parityFull, conformanceTargets],
	paths: ['../artifacts', 'hive/artifacts'],
})

export const Package = S.Package({
	targets: {
		clean,
		conformanceAll,
		conformanceCorpus,
		conformanceFast,
		conformanceTargets,
		ethereumTests,
		execSpecAll,
		execSpecFast,
		execSpecIsolate,
		executionSpecTests,
		gstAll,
		gstFast,
		gstIsolate,
		hiveRpcCompat,
		hiveSmoke,
		nightlyConformance,
		parityFast,
		parityFull,
		runners,
		traceCompare,
		traceCompareTool,
		traceConvert,
		traceTools,
		traceToolsTest,
		vitestMatchers,
	},
})
