/// <reference path="../../../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../../../factory/scoped-shell.js'

const Shell = scopedShell('examples/mud/packages/contracts')

// The MUD example's contracts workspace: a foundry project whose MUD
// codegen output (src/codegen) is committed to the template.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const mudConfig = S.file('mud.config.ts')
const foundryConfig = S.file('foundry.toml')
const remappings = S.file('remappings.txt')
const solhintConfig = S.file('.solhint.json')
const prettierConfig = S.file('.prettierrc')
const workspaceTsconfig = S.file('//examples/mud/tsconfig.json')

// worlds.json and worlds.json.d.ts stay in srcs: they are committed
// deployment manifests the client package's vite-plugin-mud reads.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**/*.sol', 'mud.config.ts', 'worlds.json', 'worlds.json.d.ts']),
})

const tests = S.Filegroup({
	srcs: S.glob(['test/**/*.sol']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build. `mud build` runs forge build and regenerates the committed MUD
// codegen, so it is a Generate: check regenerates and fails on drift,
// --write updates the tree for commit. out/ is the forge artifact dir
// foundry.toml configures.
const build = S.Generate({
	bin: S.NodeModule.Bin('@latticexyz/cli', 'mud'),
	args: ['build'],
	data: [srcs, tests, deps, mudConfig, foundryConfig, remappings],
	changes: ['src/codegen/**', 'out/**'],
})

// The first half of the manifest's `test` script (`tsc --noEmit && mud
// test`). tsconfig extends the nested workspace root's tsconfig, so both
// are key material.
const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, deps, tsconfig, workspaceTsconfig],
})

// The second half of `test`. mud test wraps forge test against the MUD
// world in src/.
const test = Shell.Test({
	bin: S.NodeModule.Bin('@latticexyz/cli', 'mud'),
	args: ['test'],
	data: [srcs, tests, deps, mudConfig, foundryConfig, remappings],
})

// dev. `mud dev-contracts` watches the contracts and redeploys to the
// local anvil on every change; the mprocs stack at //examples/mud provides
// the anvil it targets.
const dev = Shell.Serve({
	bin: S.NodeModule.Bin('@latticexyz/cli', 'mud'),
	args: ['dev-contracts'],
	data: [srcs, deps, mudConfig, foundryConfig, remappings],
})

// deploy:local. Broadcasts to a local anvil, so no approval: the fallback
// key is anvil's well-known default account (the one mprocs.yaml uses).
const deployLocal = Shell.Run({
	bin: S.NodeModule.Bin('@latticexyz/cli', 'mud'),
	args: ['deploy'],
	data: [build, deps, foundryConfig],
	secrets: [
		S.Secret('PRIVATE_KEY', { fallback: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' }),
	],
	sandbox: { network: true },
})

// deploy:garnet. Broadcasts to the Garnet testnet (foundry.toml's garnet
// profile pins the RPC), an outward irreversible action.
const deployGarnet = Shell.Run({
	bin: S.NodeModule.Bin('@latticexyz/cli', 'mud'),
	args: ['deploy', '--profile=garnet'],
	data: [build, deps, foundryConfig],
	secrets: [S.Secret('PRIVATE_KEY')],
	sandbox: { network: true },
	approval: 'required',
})

// deploy:redstone. Broadcasts to Redstone mainnet.
const deployRedstone = Shell.Run({
	bin: S.NodeModule.Bin('@latticexyz/cli', 'mud'),
	args: ['deploy', '--profile=redstone'],
	data: [build, deps, foundryConfig],
	secrets: [S.Secret('PRIVATE_KEY')],
	sandbox: { network: true },
	approval: 'required',
})

// prettier. `prettier --write 'src/**/*.sol'` (prettier-plugin-solidity).
const prettier = Shell.Diff({
	bin: S.NodeModule.Bin('prettier'),
	args: ['--write', 'src/**/*.sol'],
	data: [srcs, prettierConfig],
	changes: ['src/**/*.sol'],
})

// solhint. `solhint --config ./.solhint.json 'src/**/*.sol' --fix`.
const solhint = Shell.Diff({
	bin: S.NodeModule.Bin('solhint'),
	args: ['--config', './.solhint.json', 'src/**/*.sol', '--fix'],
	data: [srcs, solhintConfig],
	changes: ['src/**/*.sol'],
})

// lint. The script runs prettier and solhint; both are write-mode linters,
// so the lint target is the suite of the two Diffs.
const lint = S.Suite({
	tests: [prettier, solhint],
})

// clean. `forge clean && shx rm -rf src/**/codegen`: forge clean removes
// cache/ and out/, the shx call removes the generated codegen. node_modules
// is left to the workspace's install layer.
const clean = S.Clean({
	targets: [build],
	paths: ['cache', 'out', 'src/**/codegen'],
})

export const Package = S.Package({
	targets: {
		build,
		clean,
		deployGarnet,
		deployLocal,
		deployRedstone,
		dev,
		lint,
		prettier,
		solhint,
		srcs,
		test,
		tests,
		typecheck,
	},
})
