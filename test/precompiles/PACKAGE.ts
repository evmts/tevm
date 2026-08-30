/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('test/precompiles')

// Integration suite for @tevm/precompiles over the built workspace
// packages. Private, so there is no pack, packageLint, or apiCompat. The
// specs fork no live network, so there is no testFork target.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const vitestConfig = S.file('vitest.config.ts')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/__snapshots__/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// test:run. The `test` script is the same suite in watch mode and is not a
// CI check, so it is not a target.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// test:coverage. vitest.config.ts declares no coverage thresholds, so there
// is no coverageGate: the report exists for inspection only.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
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
