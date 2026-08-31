/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

// Exemplar for the Rust crates in the cargo workspace (runtime-rs and
// solc-rs follow this shape). Targets resolve the toolchain through the
// workspace's S.Cargo.Workspace layer and are keyed on Cargo.lock plus the
// crate's sources.
const packageJson = S.file("package.json")

const srcs = S.Filegroup({
  srcs: S.glob(["src/**", "Cargo.toml", "build.rs"]),
})

const build = S.Cargo.Build({
  crate: "tevm_resolutions_rs",
  profile: "release",
  data: [srcs],
})

const testRust = S.Cargo.Test({
  crate: "tevm_resolutions_rs",
  data: [srcs],
})

// napi emits the platform-native index.node plus the per-platform npm/*
// stub packages. Platform coverage beyond the host runs in CI runners;
// locally this builds the host triple only.
const napi = S.Napi.Build({
  crate: "tevm_resolutions_rs",
  release: true,
  data: [srcs, packageJson],
  outDirs: ["npm"],
  outFiles: ["index.node"],
})

// The wasm-size-check workflow as a gate: a byte budget on the shipped
// artifact, failing the build instead of a reviewer eyeballing a report.
const wasmSize = S.Size.Gate({
  of: napi,
  file: "tevm_resolutions_rs.wasm",
  limit: "3 mb",
})

const example = S.Shell.Run({
  bin: S.Runtime.bin,
  args: ["examples/usage.js"],
  data: [S.Filegroup({ srcs: S.glob(["examples/**"]) }), build],
})

export const Package = S.Package({
  targets: { build, example, napi, srcs, testRust, wasmSize },
})
