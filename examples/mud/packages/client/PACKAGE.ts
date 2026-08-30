/// <reference path="../../../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../../../factory/scoped-shell.js'
import { Package as contracts } from '../contracts/PACKAGE.js'

const Shell = scopedShell('examples/mud/packages/client')

// The MUD example's react client. vite-plugin-mud reads the contracts
// package's committed worlds.json, so the contracts sources are a data
// edge on every vite target.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const viteConfig = S.file('vite.config.ts')
const tailwindConfig = S.file('tailwind.config.ts')
const postcssConfig = S.file('postcss.config.cjs')
const indexHtml = S.file('index.html')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build. vite build.
const build = Shell.Build({
	bin: S.NodeModule.Bin('vite'),
	args: ['build'],
	data: [srcs, deps, contracts.srcs, viteConfig, tsconfig, tailwindConfig, postcssConfig, indexHtml, packageJson],
	outDirs: ['dist'],
})

// dev. The vite dev server.
const dev = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	data: [srcs, deps, contracts.srcs, viteConfig, tailwindConfig, postcssConfig, indexHtml],
	readiness: { port: 5173 },
})

// preview. Serves the build output.
const preview = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	args: ['preview'],
	data: [build],
	readiness: { port: 4173 },
})

// The manifest's `test` script is `tsc --noEmit`: the package has no test
// runner, so the script is declared under its real name.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig],
})

export const Package = S.Package({
	targets: {
		build,
		dev,
		preview,
		srcs,
		typecheck,
	},
})
