/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// The tevm language server. This package has no build of its own: the
// server entry point (src/index.ts) is bundled into lsp/vscode's dist by
// that package's esbuild script, and the bin/*.cjs wrappers are shipped
// as-is. The only script is test:coverage, so this file declares just the
// source groups and the coverage run.
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

// The tevm.json fixture the language tests load.
const testFixtures = S.Filegroup({
	srcs: S.glob(['fixtures/**']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// test:coverage. This is also the package's only test entry point: there is
// no plain test:run script.
const testCoverage = S.Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, testFixtures, deps, vitestConfig, tsconfig],
	outDirs: ['coverage'],
})

// The thresholds are vitest.config.ts's verbatim: all zero. The gate passes
// on any report; it exists so the floors are explicit when they are raised.
const coverageGate = S.Coverage.Gate({
	report: testCoverage,
	thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
})

export const Package = S.Package({
	targets: { coverageGate, srcs, testCoverage, tests },
})
