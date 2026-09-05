/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('examples/bun')

// The bun example: a single script and its spec run through bun with the
// tevm bun plugin preloaded, so `.sol` imports resolve in tests.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const bunfig = S.file('bunfig.toml')
const plugins = S.file('plugins.ts')

const srcs = S.Filegroup({
	srcs: S.glob(['*.ts', '*.sol', '!*.spec.ts']),
})

const tests = S.Filegroup({
	srcs: S.glob(['*.spec.ts']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// dev. A bun watcher with no port. bunfig.toml preloads plugins.ts, which
// registers the tevm plugin that compiles ExampleContract.sol on import.
const dev = Shell.Run({
	bin: S.Mise.bin('bun'),
	args: ['--watch', 'readContract.ts'],
	data: [srcs, deps, bunfig, plugins, tsconfig],
})

// test. The manifest's `test` script is `bun run test`, which recurses into
// itself and never runs a test; the target runs `bun test` directly. The
// bunfig [test] preload registers the same plugin for the spec's `.sol`
// import.
const test = Shell.Test({
	bin: S.Mise.bin('bun'),
	args: ['test'],
	data: [srcs, tests, deps, bunfig, plugins, tsconfig],
})

export const Package = S.Package({
	targets: {
		dev,
		srcs,
		test,
		tests,
	},
})
