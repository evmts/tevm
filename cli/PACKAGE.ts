/// <reference path="../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../factory/scoped-shell.js'

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

const deps = S.Filegroup({ srcs: [packageJson] })

// build:app, first half: `tsc --skipLibCheck` into dist.
const compile = Shell.Build({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--skipLibCheck'],
	data: [srcs, deps, tsconfig],
	outDirs: ['dist'],
})

// build:app, second half: the pinned bun lockfile the generated projects
// ship with is copied into dist. A first-class target so the compile stays a
// pure tsc invocation.
const lockfileStamp = S.Copy({
	from: S.file('src/utils/bun.lockb'),
	to: 'dist/utils/bun.lockb',
})

const build = S.Filegroup({
	srcs: [compile, lockfileStamp],
})

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

export const Package = S.Package({
	targets: {
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
