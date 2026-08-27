/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// bundler-packages/resolutions-rs/PACKAGE.ts is the exemplar for the Rust
// crates in the cargo workspace. This crate is private and ships no napi
// bindings, so there are no napi or wasmSize targets. Targets are keyed on
// Cargo.lock plus the crate's sources; the workspace .cargo/config.toml
// redirects target-dir to dist/target. Skipped scripts: build:release
// repeats build verbatim.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**', 'Cargo.toml', 'build.rs']),
})

// build (cargo build --release).
const build = S.Cargo.Build({
	crate: 'tevm_solc_rs',
	profile: 'release',
	data: [srcs],
})

// build:debug (cargo build).
const buildDebug = S.Cargo.Build({
	crate: 'tevm_solc_rs',
	profile: 'dev',
	data: [srcs],
})

// test (cargo test).
const testRust = S.Cargo.Test({
	crate: 'tevm_solc_rs',
	data: [srcs],
})

export const Package = S.Package({
	targets: { build, buildDebug, srcs, testRust },
})
