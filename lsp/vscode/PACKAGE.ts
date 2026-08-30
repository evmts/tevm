/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('lsp/vscode')

// The VS Code extension for tevm. scripts/build.js bundles both entry
// points with esbuild: the client (src/extension.ts) and the server
// (../lsp/src/index.ts, the @tevm/lsp workspace dependency, covered by
// deps). The package is private: it ships as a .vsix through the VS Code
// Marketplace, not npm, so there is no Npm.Pack and no apiCompat.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const vitestConfig = S.file('vitest.config.ts')
const buildScript = S.file('scripts/build.js')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build. The `--` forwards --minify to the esbuild context in the script.
const build = Shell.Build({
	bin: S.Runtime.bin,
	args: ['scripts/build', '--', '--minify'],
	data: [srcs, buildScript, deps, tsconfig, packageJson],
	outDirs: ['dist'],
})

// watch. The same esbuild context in watch mode; a long-running watcher
// with no port.
const watch = Shell.Run({
	bin: S.Runtime.bin,
	args: ['scripts/build', '--', '--watch'],
	data: [srcs, buildScript, deps, tsconfig],
})

// pack. The script builds first and then runs `vsce package --pre-release`;
// build is a data edge, so the .vsix is always packed from a current dist.
const pack = Shell.Build({
	bin: S.NodeModule.Bin('vsce'),
	args: ['package', '--pre-release'],
	data: [build, packageJson],
	outFiles: ['*.vsix'],
})

// release. `vsce publish --pre-release` pushes the extension to the
// Marketplace: outward, so it declares approval, the publisher token, and
// network access.
const release = Shell.Run({
	bin: S.NodeModule.Bin('vsce'),
	args: ['publish', '--pre-release'],
	data: [build, packageJson],
	secrets: [S.Secret('VSCE_PAT')],
	sandbox: { network: true },
	approval: 'required',
})

// test:coverage. This is also the package's only test entry point: there is
// no plain test:run script.
const testCoverage = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', '--coverage'],
	data: [srcs, tests, deps, vitestConfig, tsconfig],
})

// The thresholds are vitest.config.ts's verbatim: all zero. The gate passes
// on any report; it exists so the floors are explicit when they are raised.
const coverageGate = S.Alias(testCoverage)

// clean. Removes the bundled extension and the coverage report.
const clean = S.Clean({
	targets: [build, testCoverage],
	paths: ['dist', 'coverage'],
})

export const Package = S.Package({
	targets: { build, clean, coverageGate, pack, release, srcs, testCoverage, tests, watch },
})
