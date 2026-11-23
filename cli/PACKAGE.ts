/// <reference path="../smithers.d.ts" />
const S = Smithers

import { Package as pkg_base_bundler } from '../bundler-packages/base-bundler/PACKAGE.js'
import { Package as pkg_bundler_cache } from '../bundler-packages/bundler-cache/PACKAGE.js'
import { Package as pkg_config } from '../bundler-packages/config/PACKAGE.js'
import { vitestBench } from '../factory/bench.js'
import { scopedShell } from '../factory/scoped-shell.js'
import { Package as pkg_actions } from '../packages/actions/PACKAGE.js'
import { Package as pkg_common } from '../packages/common/PACKAGE.js'
import { Package as pkg_contract } from '../packages/contract/PACKAGE.js'
import { Package as pkg_memory_client } from '../packages/memory-client/PACKAGE.js'
import { Package as pkg_server } from '../packages/server/PACKAGE.js'
import { Package as pkg_utils } from '../packages/utils/PACKAGE.js'

const Shell = scopedShell('cli')

// The tevm CLI: an ink (React) terminal app compiled with tsc, not tsup, and
// tested with ava and vitest. Its upstream `test` script chains prettier, xo,
// and ava in one command; each is its own target so a formatting diff does
// not mask a real test failure.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.spec.tsx', '!src/**/*.test.ts', '!src/tests/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/**/*.test.ts', 'src/tests/**', 'test.tsx']),
})

const benches = S.Filegroup({
	srcs: S.glob(['bench/**']),
})

const deps = S.Filegroup({
	srcs: [
		packageJson,
		pkg_actions.build,
		pkg_base_bundler.build,
		pkg_bundler_cache.build,
		pkg_common.build,
		pkg_config.build,
		pkg_contract.build,
		pkg_memory_client.build,
		pkg_server.build,
		pkg_utils.build,
	],
})

// build:app, first half: `tsc --skipLibCheck` into dist.
const compile = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--skipLibCheck'],
	data: [
		srcs,
		deps,
		pkg_actions.types,
		pkg_base_bundler.types,
		pkg_bundler_cache.types,
		pkg_common.types,
		pkg_config.types,
		pkg_contract.types,
		pkg_memory_client.types,
		pkg_server.types,
		pkg_utils.types,
		tsconfig,
	],
	outDirs: ['dist'],
})

// Editor projects link to this installed native host; no registry lockfile is copied.
const build = S.Filegroup({ srcs: [compile] })

const dev = Shell.Run({
	bin: S.NodeModule.Bin('tsx'),
	args: ['src/cli.tsx'],
	data: [srcs, deps],
})

// The `test` script's three members. prettier's config is the
// @vdemedes/prettier-config package named in package.json, so the manifest
// is key material; xo extends xo-react and reads the same manifest block.
const prettierCheck = Shell.Test({
	bin: S.NodeModule.Bin('prettier'),
	args: ['--check', '.'],
	data: [srcs, tests, packageJson],
})

const xoLint = Shell.Test({
	bin: S.NodeModule.Bin('xo'),
	data: [srcs, tests, packageJson],
})

// ava's config (tsx loader, ts/tsx as modules) lives in the manifest.
const testAva = Shell.Test({
	bin: S.NodeModule.Bin('ava'),
	data: [srcs, tests, deps, packageJson],
})

const test = S.Suite({
	tests: [prettierCheck, xoLint, testAva],
})

// test:coverage builds the app first, then runs vitest with coverage; the
// build is a data edge instead of a chained command. The integration spec
// verifies pinned Optimism/mainnet RPC data and a real loopback server, so
// both variants declare the same network and RPC-secret boundary.
const testVitest = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, build],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, build],
	secrets: [S.Secret('TEVM_TEST_ALCHEMY_KEY'), S.Secret('TEVM_RPC_URLS_MAINNET'), S.Secret('TEVM_RPC_URLS_OPTIMISM')],
	sandbox: { network: true },
})

// lint:check and format/lint: biome, the same as every other package.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

const depsLint = Shell.Test({
	bin: S.NodeModule.Bin('depcheck'),
	args: ['--ignores=@tevm/contract'],
	data: [srcs, tests, packageJson],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [build, srcs],
})

const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

const clean = S.Clean({
	targets: [compile, testCoverage],
	paths: ['dist', 'coverage'],
})

const check = S.Suite({
	tests: [lint, test, testVitest, depsLint],
})

const bench = vitestBench('cli', {
	data: [srcs, benches, deps, tsconfig],
	sandbox: { network: 'loopback' },
})

export const Package = S.Package({
	targets: {
		bench,
		benches,
		build,
		check,
		clean,
		depsLint,
		dev,
		format,
		lint,
		pack,
		packageLint,
		prettierCheck,
		srcs,
		test,
		testAva,
		testCoverage,
		testVitest,
		tests,
		xoLint,
	},
})
