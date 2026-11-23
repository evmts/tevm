/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as pkg_base_bundler } from '../../bundler-packages/base-bundler/PACKAGE.js'
import { Package as pkg_bundler_cache } from '../../bundler-packages/bundler-cache/PACKAGE.js'
import { Package as pkg_config } from '../../bundler-packages/config/PACKAGE.js'
import { vitestBench } from '../../factory/bench.js'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('lsp/lsp')

// The npm package builds its own language server entry for the standalone bin.
// The VS Code extension bundles that server separately.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const vitestConfig = S.file('vitest.config.ts')

// Sources include the shipped bin wrappers; tests are the colocated specs.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'bin/**', '!src/**/*.spec.ts', '!src/**/*.test.ts']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts']),
})

const benches = S.Filegroup({
	srcs: S.glob(['bench/**']),
})

// The tevm.json fixture the language tests load.
const testFixtures = S.Filegroup({
	srcs: S.glob(['fixtures/**']),
})

const deps = S.Filegroup({ srcs: [packageJson, pkg_base_bundler.build, pkg_bundler_cache.build, pkg_config.build] })

const buildDist = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--skipLibCheck'],
	data: [srcs, deps, tsconfig],
	outDirs: ['dist'],
})

// test:coverage. This is also the package's only test entry point: there is
// no plain test:run script.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, testFixtures, deps, vitestConfig, tsconfig],
})

// The thresholds are vitest.config.ts's verbatim: all zero. The gate passes
// on any report; it exists so the floors are explicit when they are raised.
const coverageGate = S.Alias(testCoverage)

const bench = vitestBench('lsp/lsp', {
	data: [srcs, benches, deps, tsconfig],
})

export const Package = S.Package({
	targets: {
		bench,
		benches,
		buildDist,
		coverageGate,
		srcs,
		testCoverage,
		tests,
	},
})
