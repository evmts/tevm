/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('bundler-packages/resolutions-rs')

// Exemplar for the Rust crates in the cargo workspace (runtime-rs and solc-rs
// follow this shape). Targets resolve the toolchain and crate graph through
// the workspace's S.Cargo.Workspace layer and are keyed on Cargo.lock plus the
// crate's sources. .cargo/config.toml redirects cargo's target-dir to
// dist/target, so the crate's outputs land under dist/ like every other
// package's.
const packageJson = S.file('package.json')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'Cargo.toml', 'build.rs']),
})

// The JS surface napi generates against: the loader (index.js), its
// declarations, the browser and wasi entry points, and the wasi workers.
const bindings = S.Filegroup({
	srcs: S.glob(['index.js', 'index.d.ts', 'browser.js', '*.wasi*.js', '*.wasi*.cjs', 'wasi-worker*.mjs']),
})

const examples = S.Filegroup({
	srcs: S.glob(['examples/**']),
})

const testFixtures = S.Filegroup({
	srcs: S.glob(['test/**']),
})

// build and build:release are the same `cargo build --release`; build:debug
// is the dev profile. The release profile in the root Cargo.toml turns on lto
// and panic=abort, so the two profiles key apart on more than a flag.
const build = S.Cargo.Build({
	package: 'tevm_resolutions_rs',
	profile: 'release',
	data: [srcs],
})

const buildDebug = S.Cargo.Build({
	package: 'tevm_resolutions_rs',
	profile: 'dev',
	data: [srcs],
})

// The `test` script: cargo test over the crate. Named testRust so //**:test
// stays the JS runner set and //bundler-packages/**:testRust is the cargo
// set (root CI's "Tests Rust" step).
const testRust = S.Cargo.Test({
	package: 'tevm_resolutions_rs',
	data: [srcs],
})

// build:napi. The local package-mode Flows release does not yet wrap napi,
// so declare the repository's existing command directly. It builds the host
// binding; the release matrix remains the responsibility of CI runners.
const napi = Shell.Build({
	bin: S.NodeModule.Bin('@napi-rs/cli', 'napi'),
	args: ['build', '--platform', '--release'],
	data: [srcs, packageJson],
	outFiles: ['index.node'],
})

// Keep the host binding under a deterministic byte budget. WASI artifacts are
// produced only by the release matrix and retain their checked-in CI budget.
const wasmSize = Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/check-file-size.mjs', 'bundler-packages/resolutions-rs/index.node', '3 mb'],
	data: [napi, S.file('//scripts/check-file-size.mjs')],
})

// The `example` script: examples/usage.js loads the native binding through
// index.js.
const example = Shell.Run({
	bin: S.Runtime.bin,
	args: ['examples/usage.js'],
	data: [examples, bindings, napi],
})

// test/index.js exercises the binding from node against test/fixtures. No
// package.json script runs it today; it is declared so the JS surface has a
// test the same way the crate does.
const testNode = Shell.Test({
	bin: S.Runtime.bin,
	args: ['test/index.js'],
	data: [testFixtures, bindings, napi],
})

// prepublishOnly: `napi prepublish -t npm` stamps the platform packages'
// versions from the manifest before publish. A Diff over the stub manifests,
// so a version drift is visible as a check.
const prepublish = Shell.Diff({
	bin: S.NodeModule.Bin('@napi-rs/cli', 'napi'),
	args: ['prepublish', '-t', 'npm'],
	data: [napi, packageJson],
	changes: ['npm/*/package.json'],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [bindings, napi, prepublish],
})

const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

const clean = S.Clean({
	targets: [build, buildDebug, napi],
	paths: ['dist/target', 'index.node', 'npm/*/*.node'],
})

const check = S.Suite({
	tests: [testRust, testNode, wasmSize, packageLint],
})

export const Package = S.Package({
	targets: {
		bindings,
		build,
		buildDebug,
		check,
		clean,
		example,
		napi,
		pack,
		packageLint,
		prepublish,
		srcs,
		testNode,
		testRust,
		wasmSize,
	},
})
