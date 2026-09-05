# Native migration validation

Local validation on September 5, 2026, using Node 24.12.0, pnpm 10.33.4, Zig
0.15.2, and the modified sibling ZEVM, Voltaire, and Guillotine Mini worktrees.
These results describe this checkout, not a published release.

## Passing checks

| Check | Result |
| --- | --- |
| ZEVM `zig build test npm-smoke -Doptimize=ReleaseSafe` | Native tests and Node-API smoke pass |
| Voltaire `zig build test-state-manager -Doptimize=ReleaseSafe` | 23 tests pass |
| Guillotine Mini `zig build test-trace -Doptimize=ReleaseSafe` | Native opcode trace regression passes |
| `pnpm build:host` | Clean runtime and declaration builds pass for 15 host/config packages |
| `pnpm --dir tevm exec tsup` and `tsup --dts-only` | Facade runtime and declarations build |
| `pnpm --dir cli build:app` | CLI compiles |
| Focused Vitest runs across node, actions, memory-client, server, MCP, adapters, common, utils, and errors | 170 tests pass |
| Selected CLI utility and local integration tests | 18 pass; 3 outside the selected local suite |
| Selected test-utils fixtures | 5 local tests pass; network case excluded |
| Node, actions, memory-client, and server coverage runs | Configured coverage gates pass |
| Source integrity, repository metadata, factory policy, scope checks and factory TypeScript compilation | Direct checks pass |
| Biome over changed host source/config files | Passes |
| Vite example, playground, and browser RPC bundle | Build successfully |

The integration tests execute the compiled native addon. They cover deployment,
ABI calls, signed transactions, receipts, account/storage edits, mining,
snapshots, state dumps, loopback fork reads, native tracing, HTTP batches and
notifications, WebSocket/IPC subscriptions, malformed connections, and lifecycle
cleanup. Network-dependent tests using configured external credentials were not
run. Server coverage is 98.8% statements, 90.5% branches, 100% functions, and
99.12% lines; memory-client coverage is 100% in every category.

The TEVM dependency lockfile and retained runtime sources contain no EthereumJS
dependency/import. Clean generated host outputs contain no imports of retired
engine packages. ZEVM-owned source contains no TypeScript files or EthereumJS
references. Third-party specification/reference submodules remain separate
conformance inputs and may contain examples in other languages.

## Release preparation update

The factory loader now shares the CLI-provided Smithers API instance without
changing the Flows revision. Workspace query, planning, generated workflow
write/check, source integrity, and repository metadata targets now run. Full
preflight passes with an isolated installation of the policy-pinned Codex CLI
0.150.1. The user's global Codex installation is unchanged.

Guillotine Mini's repaired fixtures now pass `zig build unit test-trace
-Doptimize=ReleaseSafe`: 997 tests pass and one is skipped. Truncated PUSH
assertions verify Ethereum zero padding, and CALL-family fixtures register their
parent frame with the native EVM.

`changeset status` validates the TEVM release plan, including `1.0.0-rc.154` for
`tevm` and `@tevm/node`. Obsolete changeset entries for removed packages were
removed; active package entries remain. Native source revisions are recorded in
`factory/native-dependencies.json`; generated CI checks them out before pnpm
installation. Release workflows use Changesets to create version PRs and publish.

## Unresolved release gates

- `//:agentLints` runs, but the migration's large deletion diff exceeds the
  pinned runner's 16 MiB diff limit and the model input limit of 1,048,576
  characters. The aggregate judgment gate is not green.
- Full hardfork conformance, Hive/parity suites, and cross-platform ZEVM native
  packages remain unqualified. The native publisher now refuses to publish an
  incomplete platform set. A selected-platform Zig build produces only that
  platform's addon.
- Local npm authentication returns HTTP 401. ZEVM has no repository-level npm
  secret configured; registry publishing access must be established before its
  new native packages can be published.
- GitHub release branches and PRs are being validated. A prepared changeset or
  a successful local test is not evidence of an npm publication or a green CI run.

See [the migration guide](native-engine-migration.md) for supported behavior and
intentional compatibility breaks.
