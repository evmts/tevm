/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// The esbuild example. The manifest's build and test:coverage/test:run
// scripts are all commented out; the targets below are what those scripts
// name, restored as declarations.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const bunfig = S.file('bunfig.toml')
const foundryConfig = S.file('foundry.toml')
const buildScript = S.file('build.js')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'plugins.ts', '!src/**/*.spec.js']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.js']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// //build:app (commented out). build.js drives esbuild with
// esbuildPluginTevm, which compiles src/ExampleContract.sol at bundle time;
// foundry.toml pins the solc version the plugin uses. The commented script
// sets NODE_ENV=production, which build.js reads into its define.
const build = S.Shell.Build({
	bin: S.Runtime.Bun.bin,
	args: ['build.js'],
	env: { NODE_ENV: 'production' },
	data: [srcs, deps, buildScript, bunfig, foundryConfig, tsconfig, packageJson],
	outDirs: ['dist'],
})

// dev. The script is `bun run build && node ./dist/index.js`, but the build
// script it chains is commented out, so the script fails today. The target
// keys on the build output instead of re-running the chain.
const dev = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['./dist/index.js'],
	data: [build],
})

// //test:run (commented out). bunfig.toml preloads plugins.ts for tests, so
// the spec's `.sol` import resolves under bun test.
const test = S.Shell.Test({
	bin: S.Runtime.Bun.bin,
	args: ['test'],
	data: [srcs, tests, deps, bunfig, foundryConfig, tsconfig],
})

export const Package = S.Package({
	targets: {
		build,
		dev,
		srcs,
		test,
		tests,
	},
})
