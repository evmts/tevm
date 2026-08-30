/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('examples/vite')

// The vite example: a react app whose contracts are a foundry project
// (foundry.toml, src/contracts) that the vite plugin compiles on import.
// The `serve:test` script is a shell compound of the anvil fork and the
// vite dev server; the anvil service plus the dev target cover it, so it
// is not declared. The `format` script (`biome format . --write`) is a
// subset of the format Diff below (`biome check . --write --unsafe`
// includes formatting), so it is not declared separately.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const viteConfig = S.file('vite.config.ts')
const tevmConfig = S.file('tevm.config.json')
const foundryConfig = S.file('foundry.toml')
const biomeConfig = S.file('biome.json')
const rootBiomeConfig = S.file('//biome.json')
const indexHtml = S.file('index.html')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/*.sol']),
})

// The foundry project's sources: the contracts under src/contracts
// (foundry.toml's src) and the deploy script under script/.
const contracts = S.Filegroup({
	srcs: S.glob(['src/**/*.sol', 'script/**/*.sol']),
})

const tests = S.Filegroup({
	srcs: S.glob(['src/**/*.spec.ts', 'src/**/*.test.ts']),
})

const deps = S.Filegroup({ srcs: [packageJson] })

// build:contracts. forge build; foundry.toml sets out = "artifacts" and
// resolves libs from node_modules, so deps is a data edge.
const buildContracts = S.Foundry.Build({
	config: foundryConfig,
	data: [contracts, deps],
	outDirs: ['artifacts'],
})

// build:app. The manifest's `//build:app` key is commented out, but the
// `build` script still chains it; this is the vite build the chain
// intends. tevm.config.json marks the foundry project for the vite plugin.
const buildApp = Shell.Build({
	bin: S.NodeModule.Bin('vite'),
	args: ['build'],
	data: [srcs, contracts, deps, viteConfig, tsconfig, tevmConfig, foundryConfig, indexHtml, packageJson],
	outDirs: ['dist'],
})

// build. `bun build:contracts && bun build:app` as a suite of the two.
const build = S.Suite({
	tests: [buildContracts, buildApp],
})

// dev. The vite dev server.
const dev = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	data: [srcs, contracts, deps, viteConfig, tsconfig, tevmConfig, foundryConfig, indexHtml],
	readiness: { port: 5173 },
})

// preview. vite preview serves the build output.
const preview = Shell.Serve({
	bin: S.NodeModule.Bin('vite'),
	args: ['preview'],
	data: [buildApp],
	readiness: { port: 4173 },
})

// serve. `serve -s -l tcp://0.0.0.0:5173 dist`: a static server over the
// vite build, used by the example's e2e flow.
const serve = Shell.Serve({
	bin: S.NodeModule.Bin('serve'),
	args: ['-s', '-l', 'tcp://0.0.0.0:5173', 'dist'],
	data: [buildApp],
	readiness: { port: 5173 },
})

// test. The script is `vitest` (watch mode); the target runs the one-shot
// form. vite.config.ts is the vitest config, so it is key material.
const test = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run'],
	data: [srcs, tests, contracts, deps, viteConfig, tsconfig, tevmConfig],
})

// lint:check. The package biome.json extends the root config, so both are
// key material.
const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--verbose'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// The manifest's `lint` script: `biome check . --write --unsafe` applies
// lint fixes and formatting inside the package. This also covers the
// package's `format` script.
const format = Shell.Diff({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.', '--write', '--unsafe'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
	changes: ['**'],
})

// format:check. `biome format .`, the format-only half of lint.
const formatCheck = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['format', '.'],
	data: [srcs, tests, biomeConfig, rootBiomeConfig],
})

// generate. `tevm generate` writes <file>.sol.ts next to every contract.
// The example does not depend on the tevm package, so the CLI resolves
// through npx and needs the network.
const generate = S.Generate({
	bin: S.Runtime.npx('tevm'),
	args: ['generate'],
	data: [contracts, tevmConfig, foundryConfig, deps],
	changes: ['src/**/*.sol.ts'],
	sandbox: { network: true },
})

// anvil. The script sources .env and interpolates the key into
// https://eth-mainnet.g.alchemy.com/v2/$VITE_ALCHEMY_API_KEY; the service
// keys on the secret as the fork URL material. No pinned block.
const anvil = S.Anvil.Fork({
	forkUrl: S.Secret('VITE_ALCHEMY_API_KEY'),
	forkBlockNumber: 'latest',
	port: 8545,
})

// deploy-contracts. `forge script --broadcast --verify` against the
// network .env configures: an outward irreversible action. The script
// sources .env, which carries DEPLOYER_PRIVATE_KEY, the RPC URL, and the
// etherscan key the --verify flag uses.
const deployContracts = Shell.Run({
	bin: S.Mise.bin('forge'),
	args: ['script', 'script/Deploy.s.sol:Deploy', '--broadcast', '--verify', '-vvvv'],
	data: [contracts, buildContracts, foundryConfig],
	secrets: [S.Secret('DEPLOYER_PRIVATE_KEY'), S.Secret('ETHERSCAN_API_KEY_1')],
	sandbox: { network: true },
	approval: 'required',
})

// deploy-contracts:anvil. The same broadcast against the local fork, so no
// approval: the target chain is disposable.
const deployContractsAnvil = Shell.Run({
	bin: S.Mise.bin('forge'),
	args: [
		'script',
		'script/Deploy.s.sol:Deploy',
		'--broadcast',
		'--verify',
		'-vvvv',
		'--fork-url',
		'http://localhost:8545',
	],
	data: [contracts, buildContracts, foundryConfig],
	services: [anvil],
	secrets: [S.Secret('DEPLOYER_PRIVATE_KEY')],
	sandbox: { network: true },
})

// clean. `rm -rf node_modules artifacts dist cache`; node_modules is left
// to the workspace's install layer.
const clean = S.Clean({
	targets: [buildContracts, buildApp],
	paths: ['artifacts', 'dist', 'cache'],
})

export const Package = S.Package({
	targets: {
		anvil,
		build,
		buildApp,
		buildContracts,
		clean,
		contracts,
		deployContracts,
		deployContractsAnvil,
		dev,
		format,
		formatCheck,
		generate,
		lint,
		preview,
		serve,
		srcs,
		test,
		tests,
	},
})
