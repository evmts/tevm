/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// The playground site: a vite app around a pinned npm tevm (not a
// workspace dependency), so there is no WorkspaceDeps edge.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const viteConfig = S.file('vite.config.ts')
const indexHtml = S.file('index.html')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'public/**']),
})

// build. vite build. vite.config.ts aliases node builtins to src/shims and
// excludes tevm from prebundling, so the config is key material.
const build = S.Shell.Build({
	bin: S.NodeModule.Bin('vite'),
	args: ['build'],
	data: [srcs, viteConfig, tsconfig, indexHtml, packageJson],
	outDirs: ['dist'],
})

// dev. The vite dev server.
const dev = S.Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	data: [srcs, viteConfig, tsconfig, indexHtml],
	readiness: { port: 5173 },
})

// preview. Serves the build output.
const preview = S.Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	args: ['preview'],
	data: [build],
	readiness: { port: 4173 },
})

export const Package = S.Package({
	targets: {
		build,
		dev,
		preview,
		srcs,
	},
})
