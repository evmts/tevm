/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

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
	crate: 'tevm_resolutions_rs',
	profile: 'release',
	data: [srcs],
})

const buildDebug = S.Cargo.Build({
	crate: 'tevm_resolutions_rs',
	profile: 'dev',
	data: [srcs],
})

// The `test` script: cargo test over the crate. Named testRust so //**:test
// stays the JS runner set and //bundler-packages/**:testRust is the cargo
// set (root CI's "Tests Rust" step).
const testRust = S.Cargo.Test({
	crate: 'tevm_resolutions_rs',
	data: [srcs],
})

// build:napi. napi emits the platform-native index.node plus the per-platform
// npm/* stub packages the manifest's napi.targets list names; the wasi
// target produces the .wasm the size gate measures. Platform coverage beyond
// the host runs in CI runners; locally this builds the host triple only.
const napi = S.Napi.Build({
	crate: 'tevm_resolutions_rs',
	release: true,
	targets: [
		'aarch64-apple-darwin',
		'aarch64-unknown-linux-gnu',
		'aarch64-unknown-linux-musl',
		'aarch64-pc-windows-msvc',
		'x86_64-unknown-linux-musl',
		'x86_64-apple-darwin',
		'i686-pc-windows-msvc',
		'wasm32-wasip1-threads',
	],
	data: [srcs, packageJson],
	outDirs: ['npm'],
	outFiles: ['index.node', 'tevm_resolutions_rs.wasm32-wasi.wasm'],
})

// The wasm-size-check workflow as a gate: a byte budget on the shipped wasi
// artifact, failing the build instead of a reviewer eyeballing a report.
const wasmSize = S.Size.Gate({
	of: napi,
	file: 'tevm_resolutions_rs.wasm32-wasi.wasm',
	limit: '3 mb',
})

// The `example` script: examples/usage.js loads the native binding through
// index.js.
const example = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['examples/usage.js'],
	data: [examples, bindings, napi],
})

// test/index.js exercises the binding from node against test/fixtures. No
// package.json script runs it today; it is declared so the JS surface has a
// test the same way the crate does.
const testNode = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['test/index.js'],
	data: [testFixtures, bindings, napi],
})

// prepublishOnly: `napi prepublish -t npm` stamps the platform packages'
// versions from the manifest before publish. A Diff over the stub manifests,
// so a version drift is visible as a check.
const prepublish = S.Shell.Diff({
	bin: S.NodeModule.Bin('@napi-rs/cli', 'napi'),
	args: ['prepublish', '-t', 'npm'],
	data: [napi, packageJson],
	changes: ['npm/*/package.json'],
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [bindings, napi, prepublish],
})

const packageLint = S.Npm.PackageLint({ pack })

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
