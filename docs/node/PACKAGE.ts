/// <reference path="../../smithers.d.ts" />
const S = Smithers
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('docs/node')

// The tevm.sh docs site (vocs) and its executable documentation tests.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const vocsConfig = S.file('vocs.config.ts')
const vitestConfig = S.file('vitest.config.ts')

const srcs = S.Filegroup({
	srcs: S.glob(['pages/**', 'components/**', 'styles/**', 'styles.css', 'public/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['tests/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build. The manifest's `build` runs `bun build:app` and `build:app` is
// `vocs build`, so the target is the vocs build directly.
const build = Shell.Build({
	bin: S.NodeModule.Bin('vocs'),
	args: ['build'],
	data: [srcs, deps, vocsConfig, packageJson],
	outDirs: ['dist'],
})

// dev. The vocs dev server.
const dev = Shell.Serve({
	bin: S.NodeModule.Bin('vocs'),
	args: ['dev'],
	data: [srcs, deps, vocsConfig],
	readiness: { port: 5173 },
})

// preview. Serves the build output.
const preview = Shell.Serve({
	bin: S.NodeModule.Bin('vocs'),
	args: ['preview'],
	data: [build],
	readiness: { port: 4173 },
})

// test. The script is `vitest` (watch mode); the target runs the one-shot
// form. Fork usage is mixed into ordinary spec files and cannot be split
// by pattern: tests/getting-started.test.ts, tests/core/create-tevm-node.test.ts,
// tests/core/managing-state.test.ts, tests/examples/forking-mainnet.test.ts,
// tests/api/memory-client.test.ts, and tests/api/methods.test.ts fork live
// networks over public RPC endpoints (for example mainnet.optimism.io), so
// the whole suite declares the network sandbox. The endpoints are public,
// so no secrets are needed.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [tests, deps, vitestConfig, tsconfig],
	sandbox: { network: true },
})

// There is no typecheck script; the tsconfig is noEmit over the whole tree
// (pages, components, and tests), so the target covers all of it.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, deps, tsconfig],
})

export const Package = S.Package({
	targets: {
		build,
		dev,
		preview,
		srcs,
		test,
		tests,
		typecheck,
	},
})
