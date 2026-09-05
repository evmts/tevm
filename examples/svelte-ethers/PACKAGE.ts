/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('examples/svelte-ethers')

// The Svelte + ethers example. The `check` and `check:watch` scripts are
// echo placeholders (svelte-check is disabled until the tevm beta), so they
// are not declared. The `//build:app` key is a commented-out script whose
// command the `build` script still chains; the build target is that vite
// build.
const packageJson = S.file('package.json')
const jsconfig = S.file('jsconfig.json')
const viteConfig = S.file('vite.config.js')
const svelteConfig = S.file('svelte.config.js')

const srcs = S.Filegroup({
	srcs: S.glob([
		'src/**',
		'static/**',
		'!src/**/*.test.js',
		'!src/**/*.spec.js',
		'!src/**/*.test.ts',
		'!src/**/*.spec.ts',
	]),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.test.js', 'src/**/*.spec.js', 'src/**/*.test.ts', 'src/**/*.spec.ts']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build. `bun run build:app`, where build:app (commented out) is `vite
// build`. SvelteKit's adapter-auto emits into .svelte-kit.
const build = Shell.Build({
	bin: S.NodeModule.Bin('vite'),
	args: ['build'],
	data: [srcs, deps, viteConfig, svelteConfig, jsconfig, packageJson],
	outDirs: ['.svelte-kit'],
})

// dev. The vite dev server.
const dev = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	args: ['dev'],
	data: [srcs, deps, viteConfig, svelteConfig, jsconfig],
	readiness: { port: 5173 },
})

// preview. Serves the build output.
const preview = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	args: ['preview'],
	data: [build],
	readiness: { port: 4173 },
})

// test. The script is `vitest` (watch mode); the target runs the one-shot
// form. vite.config.js is the vitest config (it sets test.include), so it
// is key material.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, deps, viteConfig, svelteConfig, jsconfig],
})

export const Package = S.Package({
	targets: {
		build,
		dev,
		preview,
		srcs,
		test,
		tests,
	},
})
