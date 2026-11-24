/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../../factory/scoped-shell.js'
import { Package as pkg_errors } from '../../packages/errors/PACKAGE.js'

// specs/lean has no package.json, so each suite enters the directory with `cd`
// instead of `pnpm --dir … exec`.
const Shell = scopedShell('specs/lean')

// The four Lean 4 reference specifications and their differential suites. Each suite
// builds its oracle with an incremental `lake build`, then compares the compiled Lean
// model with the live implementation case by case (`node --test`).
//
// Two inputs live outside the workspace and cannot be declared as files:
// - The Lean toolchain. Each suite's `lean-toolchain` pins the version, and `lake` comes
//   from PATH or from elan's install directory (see oracle.mjs). `lake` is not a declared
//   S.Host binary: the suites spawn it themselves.
// - The sibling Voltaire checkout that `protocol` and `primitives` compare against
//   (VOLTAIRE_DIR, default `../voltaire`), like the `../zevm` addon behind
//   //factory/native-addon.sha256.

// Shared harness setup: repository and Voltaire paths, the incremental oracle build.
const oracle = S.file('oracle.mjs')

// The ../zevm addon is outside the workspace. build-native.mjs records its SHA-256 here,
// so a rebuilt addon re-keys the suites that execute it.
const nativeAddon = S.file('//factory/native-addon.sha256')

// One suite's Lean package: the specification and the oracle entry point, the lakefile,
// the manifest and the toolchain pin. `.lake/` is build output and is never key material.
const leanPackage = (dir: string) =>
	S.Filegroup({
		srcs: S.glob([`${dir}/*.lean`, `${dir}/lakefile.toml`, `${dir}/lake-manifest.json`, `${dir}/lean-toolchain`]),
	})

const protocolSpec = leanPackage('protocol')
const primitivesSpec = leanPackage('primitives')
const hostSpec = leanPackage('host')
const engineSpec = leanPackage('engine')

const protocolHarness = S.file('protocol/diff-fuzz.test.mjs')
const primitivesHarness = S.Filegroup({
	// The suite rebuilds the proposed Voltaire fix from this patch and verifies it.
	srcs: S.glob(['primitives/diff-fuzz.test.mjs', 'primitives/upstream/**']),
})
const hostHarness = S.file('host/diff-fuzz.test.mjs')
const engineHarness = S.file('engine/diff-fuzz.test.mjs')

// The live TEVM sources the suites load without a package build.
const engineSources = S.Filegroup({
	// createZevmEngine.js, plus the @tevm/utils module the suites resolve its import to.
	// NativeRpcError.js imports the built @tevm/errors.
	srcs: [...S.glob(['//packages/node/src/**', '//packages/utils/src/**']), pkg_errors.build],
})
const hostSources = S.Filegroup({
	srcs: S.glob([
		'//packages/server/src/internal/extractJsonRpcFrames.js',
		'//bundler-packages/config/src/**',
		'//bundler-packages/config/package.json',
		'//packages/utils/src/decodeHardhatConsoleLog.js',
		'//scripts/prepare-changeset-publish.mjs',
	]),
})

// EIP-7939 CLZ, EIP-7883/7823 ModExp, EIP-7825 transaction gas cap, EIP-7934 block size,
// EIP-4844/7918 blob fees and EIP-7892 blob schedules: Voltaire TS and the native engine.
const protocol = Shell.Test({
	command: 'node --test protocol/diff-fuzz.test.mjs',
	data: [protocolSpec, protocolHarness, oracle, engineSources, nativeAddon],
})

// Fee market, precompile dispatch, P256VERIFY, checked Uint math and Hex: Voltaire TS,
// @tevm/utils and ZEVM's strict JSON-RPC quantity and data parsing.
const primitives = Shell.Test({
	command: 'node --test primitives/diff-fuzz.test.mjs',
	data: [primitivesSpec, primitivesHarness, oracle, engineSources, nativeAddon],
})

// JSON-RPC stream framing, remappings.txt, Hardhat console.log formatting, and the semver
// and workspace-protocol rules of the publish guard. Pure JavaScript: no native addon.
const host = Shell.Test({
	command: 'node --test host/diff-fuzz.test.mjs',
	data: [hostSpec, hostHarness, oracle, hostSources],
})

// The createZevmEngine lifecycle and the dev-node snapshot/revert state machine, on the
// native addon and on a pluggable backend with injected faults.
const engine = Shell.Test({
	command: 'node --test engine/diff-fuzz.test.mjs',
	data: [engineSpec, engineHarness, oracle, engineSources, nativeAddon],
})

// All four differential suites: `smthrs //specs/lean:check`.
const check = S.Suite({
	tests: [protocol, primitives, host, engine],
})

export const Package = S.Package({
	targets: {
		check,
		engine,
		engineSpec,
		host,
		hostSpec,
		primitives,
		primitivesSpec,
		protocol,
		protocolSpec,
	},
})
