/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('sites/contributor')
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const viteConfig = S.file('vite.config.ts')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')
const indexHtml = S.file('index.html')
const logo = S.file('//docs/node/public/tevm-logo-dark.png')

const srcs = S.Filegroup({
	srcs: S.glob([
		'src/**',
		'public/**',
		'!src/**/*.spec.ts',
		'!src/**/*.test.ts',
		'!src/**/*.spec.tsx',
		'!src/**/*.test.tsx',
	]),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.tsx', 'src/**/*.test.tsx']),
})

const appData = [srcs, packageJson, tsconfig, viteConfig, indexHtml, logo]
const qualityData = [srcs, tests, packageJson, tsconfig, viteConfig, biomeConfig, rootBiomeConfig]

const build = Shell.Build({
	bin: S.NodeModule.Bin('vite'),
	args: ['build'],
	data: appData,
	outDirs: ['dist'],
})

const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, packageJson, tsconfig],
})

const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, packageJson, tsconfig, viteConfig],
})

const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, packageJson, tsconfig, viteConfig],
})

const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: qualityData,
})

const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: qualityData,
	changes: ['src/**', 'index.html', 'package.json', 'tsconfig.json', 'vite.config.ts', 'biome.json', 'README.md'],
})

const formatCheck = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['format', '.'],
	data: qualityData,
})

const dev = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	data: appData,
	readiness: { port: 4310 },
})

const preview = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	args: ['preview'],
	data: [build],
	readiness: { port: 4311 },
})

const check = S.Suite({ tests: [typecheck, test, lint, build] })
const clean = S.Clean({ targets: [build], paths: ['coverage'] })

export const Package = S.Package({
	targets: {
		build,
		check,
		clean,
		dev,
		format,
		formatCheck,
		lint,
		preview,
		srcs,
		test,
		testCoverage,
		tests,
		typecheck,
	},
})
