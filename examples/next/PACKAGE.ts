/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// The Next.js example. Its lint script is prettier, not biome, so the
// format targets use prettier. The `//typecheck` key is a commented-out
// script and stays undeclared. The `all` script chains format, lint,
// typecheck, and build, but lint and typecheck do not exist as scripts, so
// `all` is not modeled.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const nextConfig = S.file('next.config.mjs')
const prettierConfig = S.file('prettier.config.js')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'public/**', 'components.json']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// build. next build emits into .next.
const build = S.Shell.Build({
	bin: S.NodeModule.Bin('next'),
	args: ['build'],
	data: [srcs, deps, nextConfig, tsconfig, packageJson],
	outDirs: ['.next'],
})

// dev. The next dev server.
const dev = S.Shell.Serve({
	bin: S.NodeModule.Bin('next'),
	args: ['dev'],
	data: [srcs, deps, nextConfig, tsconfig],
	readiness: { port: 3000 },
})

// start. Serves the production build.
const start = S.Shell.Serve({
	bin: S.NodeModule.Bin('next'),
	args: ['start'],
	data: [build],
	readiness: { port: 3000 },
})

// format:check. prettier in check mode over the same glob format writes.
const formatCheck = S.Shell.Test({
	bin: S.NodeModule.Bin('prettier'),
	args: ['--check', '**/*.{ts,tsx,mdx}', '--cache'],
	data: [srcs, prettierConfig],
})

// format. `prettier --write "**/*.{ts,tsx,mdx}" --cache`.
const format = S.Shell.Diff({
	bin: S.NodeModule.Bin('prettier'),
	args: ['--write', '**/*.{ts,tsx,mdx}', '--cache'],
	data: [srcs, prettierConfig],
	changes: ['**/*.{ts,tsx,mdx}'],
})

// clean. `rm -rf .next`. node_modules is left to the workspace's install
// layer.
const clean = S.Clean({
	targets: [build],
	paths: ['.next'],
})

export const Package = S.Package({
	targets: {
		build,
		clean,
		dev,
		format,
		formatCheck,
		srcs,
		start,
	},
})
