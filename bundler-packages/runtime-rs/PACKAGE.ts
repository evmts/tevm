/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// bundler-packages/resolutions-rs/PACKAGE.ts is the exemplar for the Rust
// crates in the cargo workspace. Targets resolve the toolchain through the
// workspace's S.Cargo.Workspace layer and are keyed on Cargo.lock plus the
// crate's sources; the workspace .cargo/config.toml redirects target-dir to
// dist/target. Skipped scripts: build:release repeats build verbatim, and
// prepublishOnly is an npm lifecycle hook the publish flow runs.
const packageJson = S.file('package.json')

const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'Cargo.toml', 'build.rs']),
})

// build (cargo build --release).
const build = S.Cargo.Build({
	crate: 'tevm_runtime_rs',
	profile: 'release',
	data: [srcs],
})

// build:debug (cargo build).
const buildDebug = S.Cargo.Build({
	crate: 'tevm_runtime_rs',
	profile: 'dev',
	data: [srcs],
})

// test (cargo test).
const testRust = S.Cargo.Test({
	crate: 'tevm_runtime_rs',
	data: [srcs],
})

// build:napi. Emits the platform-native index.node plus the per-platform
// npm/* stub packages. Platform coverage beyond the host runs in CI
// runners; locally this builds the host triple only.
const napi = S.Napi.Build({
	crate: 'tevm_runtime_rs',
	release: true,
	data: [srcs, packageJson],
	outDirs: ['npm'],
	outFiles: ['index.node'],
})

// Byte budget on the shipped wasm artifact, matching the resolutions-rs
// gate so a size regression fails the build instead of a review.
const wasmSize = S.Size.Gate({
	of: napi,
	file: 'tevm_runtime_rs.wasm',
	limit: '3 mb',
})

export const Package = S.Package({
	targets: { build, buildDebug, napi, srcs, testRust, wasmSize },
})
