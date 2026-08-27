# Smithers target graph: notes

The `WORKSPACE.ts` and `PACKAGE.ts` files declare this repository's whole
automation (install, codegen, build, typecheck, lint, test, docs, services,
publish, CI, and the agent lanes) as one content-keyed target graph for
Smithers (`@smthrs/targets`). They replace nx (`nx.json`, the `nx run-many`
scripts, the Nx Cloud cache) and the hand-written `.github/workflows/*.yml`.
This file records how the graph maps onto the repo today, what it declares
that the loader does not execute yet, and the findings the mapping surfaced.

The files are design-partner code: they define the API through usage and the
runtime is implemented to match. `smithers.d.ts` types every surface
permissively until the packages ship. Nothing here runs in CI yet; the nx
scripts and the yml workflows stay authoritative until `//.github:github
--write` replaces them.

## Layout

| Path | Role |
| --- | --- |
| `WORKSPACE.ts` | Toolchain layers (node from `.nvmrc`, bun 1.2.13, pnpm, cargo, foundry v1.7.1), host bins, agent registry, sandboxes, memory, git hooks, remote cache. |
| `PACKAGE.ts` | Tree-wide targets: Query aggregates (`//**:build`, `//**:test`, ...), `ci`, `preCommit`/`prePush`, the six agent lints, the changesets release train, the zevm sibling checkout. |
| `.github/PACKAGE.ts` | Every workflow rendered from the graph (`S.Github.Workflow` + `S.Github.CiGen`); three GitHub-native yml files preserved. |
| `packages/*/PACKAGE.ts` | One per library package. `packages/evm/PACKAGE.ts` is the exemplar. |
| `bundler-packages/*/PACKAGE.ts` | The bundler plugins (`vite` is the exemplar) and the Rust crates (`resolutions-rs` is the exemplar). |
| `extensions/*`, `lsp/*`, `configs/*`, `cli`, `tevm` | One each. |
| `test/PACKAGE.ts` | Conformance, EIP-3155 trace tooling, hive, parity. `test/*/PACKAGE.ts` for the workspace packages under test/. |
| `examples/*`, `docs/node`, `sites/*`, `evals`, `scripts` | One each. |
| `workflows/lints/*.md` | Prompts for the agent lints (`S.Agent.Lint`), one CLAUDE.md rule each. |
| `workflows/<lane>/` | Agent lanes (`S.Agent.Diff` / `S.Agent.Pr`) with a `SKILL.md` prompt and a `PACKAGE.ts`. |

## Target vocabulary

Names are contracts. The root aggregates them with `S.Query({ pattern: '//**:<name>' })`,
which is what replaces `nx run-many --target=<script>`:

| nx target / script | graph target | shape |
| --- | --- | --- |
| `build:dist` | `build` | `S.Shell.Build` (tsup) into `dist/` |
| `build:types` | `types` (+ `declarations` when the script also runs tsc) | `S.Shell.Build` into `dist/` (+ `types/`) |
| `typecheck` | `typecheck` | `S.Shell.Test` (tsc --noEmit) |
| `test:run` | `test` | `S.Shell.Test` (vitest run, bun test, ava) |
| `test:coverage` | `testCoverage` + `coverageGate` | `S.Shell.Test` into `coverage/` + `S.Coverage.Gate` with the vitest thresholds verbatim |
| fork tests | `testFork` | split out with `secrets` + `sandbox: { network: true }` where the files can be named |
| `generate:docs` | `docs` | `S.Shell.Build` (typedoc) into `docs/` |
| `lint:check` / `lint` | `lint` / `format` | `S.Shell.Test` / `S.Shell.Diff` (biome) |
| `lint:deps` | `depsLint` | `S.Shell.Test` (depcheck, `--ignores` verbatim) |
| `lint:package` | `pack` + `packageLint` | `S.Npm.Pack` + `S.Npm.PackageLint` (publint + attw over the tarball) |
| (new) | `apiCompat` | `S.Api.Compat` against the last published declarations; gates `//:publish` |
| `dev:run` | `fixtures` | `S.Shell.Test` |
| `build`/`test` (Rust) | `build`, `buildDebug`, `testRust`, `napi`, `wasmSize` | `S.Cargo.*`, `S.Napi.Build`, `S.Size.Gate` |
| `clean` | `clean` | `S.Clean` |
| (new) | `check` | `S.Suite` of the package's CI checks |

`srcs` and `tests` are separate filegroups everywhere, so a spec edit re-keys
only the test targets (nx's `productionSrc`/`testFiles` split).

Workspace dependencies are `S.Npm.WorkspaceDeps({ manifest })`: the build
outputs of a manifest's `workspace:*` dependencies in topological order. This
is nx's `dependsOn: ["^build:dist"]` as an ordinary data edge.

## CI mapping

`ci.yml`'s twelve sequential steps become `//:ci`, one suite: `allBuilds`,
`allTypes`, `allDeclarations`, `allCoverage`, `allFixtures`, `cargoTests`,
`allTypechecks`, `allLints`, `sortManifests`, `allDepsLints`,
`allPackageLints`, `allDocs`, `cargoBuilds`, `cargoCheck`, `changesetCheck`.
An unaffected target is a cache hit, so the suite is cheap on a small PR;
this subsumes the `if: always() && steps.build-dist.conclusion == 'success'`
chain in the yml.

| yml | `.github/PACKAGE.ts` | runs |
| --- | --- | --- |
| ci.yml | `ci` | `//:ci` |
| release.yml | `release` | `//:version`, `//:publish` |
| prerelease.yml | `prerelease` | `//:prereleaseEnter`, `//:prerelease` |
| prerelease-exit.yml | `prereleaseExit` | `//:prereleaseExit` |
| snapshot.yml | `snapshot` | `//:snapshot` |
| jsr-publish.yml | `jsrPublish` | `//tevm:publishJsr` |
| wasm-size-check.yml | `wasmSize` | `//bundler-packages/**:wasmSize` |
| parity-suites.yml | `paritySuites` | `//test:parityFast`, `//test:conformanceAll`, `//test:hiveSmoke` |
| (none; `//:nightlyConformance` cron) | `nightly` | `//test:conformanceAll` |
| claude-code-review.yml (prompt) | `review` | `//:prReview` |
| claude.yml, claude-auto-update.yml, claude-code-review.yml | preserved | GitHub-native event triggers |

`.github/actions/setup` (rust + cbindgen, node from `.nvmrc`, bun, zig, pnpm,
the zevm clone, foundry, apt packages) is what the renderer derives from the
`WORKSPACE.ts` layers; zig is installed by the action but nothing in the tree
uses it since the Zig implementation was removed.

## Agent lanes

Lints (`S.Agent.Lint`, diff-scoped, vacuously green on a clean diff, `--fix`
writes inside the declared set), all in `//:agentLints` and `//:prePush`:

| target | rule (CLAUDE.md) | prompt |
| --- | --- | --- |
| `jsdocLint` | complete JSDoc with working examples on exported symbols | `workflows/lints/jsdoc.md` |
| `changesetLint` | changeset present, covers the touched packages, level matches | `workflows/lints/changeset.md` |
| `noMocksLint` | tests never mock what a real object can replace | `workflows/lints/no-mocks.md` |
| `barrelExportsLint` | new exports re-exported through every barrel up to `tevm/` | `workflows/lints/barrel-exports.md` |
| `snapshotPathsLint` | no absolute paths or machine state in snapshots | `workflows/lints/snapshot-paths.md` |
| `docsParityLint` | new actions, handlers, and options get guide coverage | `workflows/lints/docs-parity.md` |

Lanes (`workflows/<lane>/PACKAGE.ts`):

| lane | shape | gates |
| --- | --- | --- |
| `conformance-triage` | `S.Agent.Diff`; isolates a failing fixture, diffs the EIP-3155 trace, lands a fix or a minimized repro | `//test:conformanceFast`, evm typecheck + test, no-mocks |
| `add-jsonrpc-method` | `S.Agent.Pr`; a new `eth_*`/`anvil_*`/`debug_*`/`tevm_*` handler end to end | actions + memory-client typecheck/test, tevm emit, barrel/jsdoc/changeset/docs/no-mocks lints |
| `upgrade-viem` | `S.Agent.Pr`; bump viem and every peer range, fix snapshots honestly | all typechecks, all tests, snapshot + changeset lints |
| `raise-coverage` | `S.Agent.Diff`; write real tests for one package, ratchet its thresholds | all coverage gates (cache hits except the package), no-mocks |
| `fix-ci` | `S.Agent.Diff`; make `//:ci` green from its per-member report | `//:ci`, `//:agentLints` |

Agents are a registry in `WORKSPACE.ts` (`S.Agents`: `default` claude-fable-5,
`luna` codex, `reviewPool`) referenced as `S.Agents.luna`, the loader's form
(`unknown_agent` at graph load); the inline `S.Agent.Codex("luna")` form from
the viem example is not used here.

## Declared, not executable today

Recorded per the flows `PACKAGE-API-CHECKLIST.md` and `FLOWS-GO-READINESS.md`
so nobody mistakes a declaration for a proof:

- `S.Npm.WorkspaceDeps`, `S.Npm.Workspaces` (+ `external`), `S.Query`,
  `S.Npm.Pack`, `S.Npm.PackageLint`, `S.Npm.Published`, `S.Api.Compat`,
  `S.Coverage.Gate`, `S.Size.Gate`, `S.Copy`: designed here and in the artsy
  examples; the loader exports none of them yet.
- `S.Cargo.Workspace`, `S.Cargo.Build/Test/Check`, `S.Napi.Build`,
  `S.Foundry.Toolchain/Build`: the Cargo namespace in the loader is the
  BUILD-era `CargoLint`/`CargoTest` only.
- `S.Runtime.Node({ versionFile })`, `S.Runtime.Bun` as a workspace layer and
  `S.Runtime.Bun.bin`/`.x`: the loader knows `S.Runtime.Node({ manifest | version })`.
- `S.Changesets.Version/Publish/Snapshot` with `prepare`, `publishWrapper`,
  `pre`, `lockfile`: the loader has `Changesets` in BUILD-era shape.
- `S.Jsr.Publish`, `S.Vercel.Deploy`, `S.Anvil.Fork`, `S.Docker.Service`,
  `S.Cron`, `S.Git.Checkout` with `path`, `S.Github.Workflow` `permissions`,
  `artifacts`, `commit`, and `workflowDispatch.inputs`.
- `S.Agent.*` dispatch, `S.Git.Commit`, `S.Github.*` emission, `S.Memory.*`
  construct and plan but do not execute (checklist lanes D/E).

## Findings the mapping surfaced

- **zevm floats.** `@evmts/zevm` is a pnpm workspace member in a sibling
  checkout (`../zevm/npm/zevm`). `.github/actions/setup` clones
  `evmts/zevm` at depth 1 with no ref, so every CI run builds against that
  repo's default branch. `//:zevmCheckout` records `rev: 'main'`; pinning a
  sha there is the fix. The checkout and its build write outside the
  workspace root, which the executor refuses (`path leaves the workspace`),
  so the cross-repo resource is specified, not runnable.
- **`compiler/` at the root is stale.** It is a second `@tevm/compiler`
  (same name as `bundler-packages/compiler`) that `pnpm-workspace.yaml` does
  not list. It has no `PACKAGE.ts`; delete it or add it to the workspace.
- **`pnpm-workspace.yaml` lists paths that do not exist:** `bundler`, `src`,
  `src/ui`. The `sort-package-json` script globs `apps/*` and
  `experimental/*`, which do not exist either.
- **Network in the hermetic suite.** `packages/actions` (24 spec files),
  `extensions/viem` (5), and the fork half of `packages/state` (9, split out
  as `//packages/state:testFork`) read live mainnet/optimism state through
  `TEVM_RPC_URLS_*`. Those targets declare the secrets and
  `sandbox: { network: true }`; recording the responses into
  `__rpc_snapshots__` is what would make them hermetic and cacheable.
- **`autoUpdate: true` coverage thresholds** (`packages/evm`,
  `packages/memory-client`, and others) rewrite `vitest.config.ts` from
  inside a test run. The graph treats the config as input only; the write
  is outside any declared write set.
- **Two `jsr.json` files.** `tevm/jsr.json` (`@tevm/tevm`) is what
  `jsr-publish.yml` publishes; the root `jsr.json` (`tevm`, exports
  `./tevm/...`) is read by nothing.
- **`wasm-size-check.yml` measures nothing** since the Zig implementation
  was removed; it writes placeholder zeros to `.wasm-sizes.json`. The
  `S.Size.Gate` targets on the napi wasi artifacts are the real check.
- **`build:rust:app` / `build:rust:lib`** target an nx project
  (`my_rust_node_lib`) that no longer exists. `cargoBuilds` and `cargoCheck`
  cover what they meant.
- **`PACKAGE.ts` files are linted by every package's `biome check .`.** They
  are written in the repo's biome style (tabs, single quotes, no semicolons)
  so `lint:check` stays green; the artsy examples use each host repo's
  formatter the same way.
- **`packages/consensus/biome.json` and `bundler-packages/mud/biome.json`
  were biome 1.x configs** (`"extends": ["../../biome.json"]`), which makes
  any root-invoked `biome check` that touches those directories fail with a
  nested-root error. Both now use the `"extends": "//"` form every other
  package uses; mud's local rule overrides were a subset of the root's, so
  nothing it allowed is now flagged.
- **`docs/node` is invisible to biome.** The root `biome.json` ignores
  `**/docs`, which also matches `docs/node`, so that site's sources and its
  `PACKAGE.ts` are never linted or formatted; `//docs/node:lint` does not
  exist for that reason.

## Per-package findings

Script defects and dead config the per-package pass surfaced. Each is also
noted in a comment in the package's `PACKAGE.ts`.

- `examples/bun`: the `test` script is `bun run test`, which calls itself.
  `//examples/bun:test` runs `bun test` directly.
- `examples/esbuild`: every build and test script is commented out
  (`//build`, `//build:app`, `//test:run`, `//test:coverage`) and `dev`
  chains the commented-out `build`, so `bun dev` fails today. The targets
  restore what the commented scripts name.
- `examples/vite`, `examples/svelte-ethers`: `build` chains a commented-out
  `build:app`. `examples/vite:anvil` keys on the Alchemy API key because the
  script interpolates it into the fork URL.
- `examples/mud/packages/contracts`: `mud build` rewrites the committed
  `src/codegen/**`, so it is a `Generate` with that write set, not a Build.
  Local deploys fall back to the well-known anvil key; garnet and redstone
  deploys are approval-gated.
- `sites/playground` pins `npm:tevm@1.0.0-rc.151` rather than the workspace
  package, so it has no WorkspaceDeps edge; `sites/core`'s sample verifier
  asserts the same published version.
- `evals`: the runner spawns the `codex` CLI per case (`codex exec`); it
  calls no model API itself, so the targets declare `codex` as a host
  binary and no API-key secret. `rescore` keys on the prior `results/` and
  `.runs/` trees.
- `scripts`: the jsdoc-helper scripts are regex-based (no model API);
  `prepare-changeset-publish.mjs` exits 0 outside GitHub Actions and marks
  the sibling zevm packages private so changesets skips them;
  `publish-jsr.js` duplicates what `//tevm:publishJsr` declares.
- `packages/consensus` is publishable but has no lint, format, docs, or
  lint:package scripts; `packages/mcp` has no lint:deps or lint:package;
  `packages/procedures` and `packages/client-types` have no tests and carry
  unused `vitest.config.ts`/`typedoc.json` files; `packages/node` and
  `packages/server` ship `types/` in their files list though no script
  emits there; `packages/server/bin/tevm-server.js` and
  `packages/receipt-manager`'s `*.spec.ts.skip`/`.bak` copies are
  unreferenced.
- `bundler-packages/whatsabi`: `test`, `test:run`, `test:ui`, and
  `lint:package` are commented out; the only suite is `test:coverage`, which
  forks live Optimism. `bundler-packages/requirejs`, `rollup`, `rspack`,
  `webpack` have no `vitest.config.ts`; `bundler-packages/tevm-run` has echo
  placeholders for `build:dist`/`build:types`. The Rust crates' `build` and
  `build:release` scripts are the same command.
- `test/bench`: no script runs its spec files; `src/arbitrum.spec.ts` forks
  live Arbitrum. `test/memory-client`: committed `__rpc_snapshots__` replay
  offline, but a cache miss falls through to live RPC, so the suite keeps
  the network sandbox. `test/mdt-repro` has no scripts and a spec that
  queries cloudflare-dns.com.
- `lsp/lsp` has no build of its own: `lsp/vscode`'s esbuild script bundles
  its server entry. `lsp/ts-plugin`'s `lint:package` is commented out.
  `configs/tsupconfig`'s `test:run` is `tsup --dts-only`, a build.
- `extensions/test-node`'s `test:run` is two runners (vitest, then `bun test`
  over the snapshot-path specs), declared as two targets and a suite.

## Surfaces introduced beyond the artsy examples

Named so the loader work can find them: `S.Suite` over build targets
(`//examples/mud:build`), `S.Shell.Run` with `outDirs` (`//evals:*`),
`S.Shell.Build` with `bin: S.Runtime.Bun.bin`, `S.Secret(name, { fallback })`
for the anvil deploy key, `S.NodeModule.Bin('@latticexyz/cli', 'mud')`,
`outFiles: ['*.vsix']` on a Build, `S.Runtime.npx('tevm')` from a package that
does not depend on tevm, `//`-anchored globs and write sets from a non-root
package (`//scripts:*`), `S.Npm.Workspaces({ external })`,
`S.Runtime.Node({ versionFile })`, `S.Cargo.Workspace({ components })`,
`S.Cargo.Check({ workspace })`, `S.Sandbox.Docker({ dockerfile })`,
`S.Changesets.Publish({ prepare, publishWrapper, pre })`,
`S.Changesets.Snapshot`, `S.Changesets.Version({ lockfile })`,
`S.Jsr.Publish({ args, dryRun })`, `S.Github.Workflow({ permissions,
artifacts, commit })`, `S.Input.Boolean`, `S.Input.String(desc, { default })`.
