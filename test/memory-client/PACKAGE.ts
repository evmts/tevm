/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('test/memory-client')

// Integration suite for @tevm/memory-client over the built workspace
// packages. Private, so there is no pack, packageLint, or apiCompat.
//
// Nearly every spec forks mainnet or optimism through cachedTransports.ts,
// which wraps the Alchemy endpoints in @tevm/test-node's snapshot
// transport. The committed __rpc_snapshots__ replay offline, but a cache
// miss falls through to the live RPC, and the fork usage is spread across
// too many spec files to split by pattern. So test keeps the secrets and
// the network sandbox rather than a separate testFork target.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const vitestConfig = S.file('vitest.config.ts')

// Sources and tests are separate groups. The committed __snapshots__ and
// __rpc_snapshots__ trees are test key material: the specs assert against
// them and the snapshot transport replays them.
const srcs = S.Filegroup({
	srcs: S.glob([
		'src/**',
		'!src/**/*.spec.ts',
		'!src/**/*.test.ts',
		'!src/**/__snapshots__/**',
		'!src/**/__rpc_snapshots__/**',
	]),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**', 'src/**/__rpc_snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// test:run. The `test` script is the same suite in watch mode and is not a
// CI check, so it is not a target.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

// test:coverage. vitest.config.ts declares no coverage thresholds, so there
// is no coverageGate: the report exists for inspection only.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

// typecheck. The tsconfig include covers all of src, spec files included,
// so tests are key material here.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, deps, tsconfig],
})

// check is the package's whole CI as one suite.
const check = S.Suite({
	tests: [typecheck, test],
})

export const Package = S.Package({
	targets: { check, srcs, test, testCoverage, tests, typecheck },
})
