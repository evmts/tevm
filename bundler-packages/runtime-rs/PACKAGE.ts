/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('bundler-packages/runtime-rs')

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
	package: 'tevm_runtime_rs',
	profile: 'release',
	data: [srcs],
})

// build:debug (cargo build).
const buildDebug = S.Cargo.Build({
	package: 'tevm_runtime_rs',
	profile: 'dev',
	data: [srcs],
})

// test (cargo test).
const testRust = S.Cargo.Test({
	package: 'tevm_runtime_rs',
	data: [srcs],
})

// build:napi. The local package-mode Flows release does not yet wrap napi, so
// model the repository's existing host build command directly.
const napi = Shell.Build({
	bin: S.NodeModule.Bin('@napi-rs/cli', 'napi'),
	args: ['build', '--platform', '--release'],
	data: [srcs, packageJson],
	outFiles: ['index.node'],
})

// Keep the host binding under the same deterministic local byte budget. The
// release-only WASI artifacts remain covered by their checked-in CI job.
const wasmSize = Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/check-file-size.mjs', 'bundler-packages/runtime-rs/index.node', '3 mb'],
	data: [napi, S.file('//scripts/check-file-size.mjs')],
})

export const Package = S.Package({
	targets: { build, buildDebug, napi, srcs, testRust, wasmSize },
})
