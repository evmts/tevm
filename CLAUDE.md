# TEVM implementation context

Read `AGENTS.md` for the enforceable repository contract and `CONTRIBUTING.md` for toolchain and factory commands.

## Native architecture

TEVM embeds ZEVM's Zig `NodeRuntime` through its C ABI and a Node-API addon. The maintained native sources are the sibling repositories `../zevm`, `../voltaire`, and `../guillotine-mini`. Voltaire supplies primitives, cryptography and state; Guillotine Mini executes bytecode. ZEVM owns the node, transaction admission, mining, chain, fork backend and JSON-RPC dispatcher.

`packages/node` serializes calls into a native handle and exposes `request`, raw `rpc`, `ready`, `close`, and a Node event emitter. It does not implement Ethereum state or transaction execution. Block events include native interval mining. Each engine owns independent state; callers must close handles.

`packages/memory-client` builds a viem client and transport over the engine. Its convenience helpers only convert ABI values and request native RPC methods. `packages/server` delivers native RPC over HTTP, WebSocket and IPC. Connection-scoped subscriptions use native filters.

The old JavaScript VM, state-manager, transaction, trie, txpool, receipt, procedure and decorator packages have been retired. Do not recreate these abstractions, install a registry fallback engine, or restore EthereumJS. ZEVM's bindings contain JavaScript and C, not TypeScript wrappers.

Browsers connect to a native node through JSON-RPC. A browser execution adapter is not implemented. Solidity compiler plugins, ABI contracts and TypeScript tooling remain host-side features.

## Working on behavior

For execution, state, mining or RPC semantics, change the native implementation in the appropriate sibling repository. For host lifecycle, transport delivery or ABI convenience methods, change TEVM. Keep exact JSON-RPC quantity/data/null/error encoding covered by real native integration tests.

Native RPC calls are synchronous. Tests that fork an HTTP upstream must run that service in another process, so the same JavaScript event loop is not blocked while serving its own request. Keep a deterministic local fixture; do not rely on private RPC endpoints.

See `docs/native-engine-migration.md` for API changes, removed surfaces and state/session formats. A viem method's presence does not establish native support; inspect ZEVM's dispatcher and tests before claiming compatibility.

## Validation

Use Node from `.nvmrc`, pnpm from `packageManager`, and the versions in `mise.toml`. Run `pnpm factory:preflight`; inspect exact package target labels and plans as described in `AGENTS.md`.

Rebuild native edits with `mise exec -- node scripts/factory/build-native.mjs`. The script verifies Zig's pin and compiles the current sibling source, including local changes. `zig build npm-smoke -Doptimize=ReleaseSafe` in ZEVM tests the real addon. TEVM's nearest regressions are in `packages/node`, `packages/memory-client`, `packages/server`, `extensions/viem`, `extensions/ethers`, and `packages/http-client`.

Runtime JavaScript uses complete JSDoc and checkJs. Public declarations live in TypeScript and must be exported through package barrels and the `tevm` facade. Keep one exported concept per file, use real fixtures, preserve existing coverage thresholds, and add a changeset for published behavior.

## Smithers Cloud Factory and MCP

TEVM runs publicly on Smithers Cloud at `https://smithers.sh/evmts/tevm` with two-way GitHub mirroring (`https://github.com/evmts/tevm`).

- **MCP-first agent workflow**: Connect to `https://smithers.sh/evmts/tevm/mcp` (OAuth 2.1 + PKCE) to read repo state, create artifacts, TODOs, issues, Changes/PRs, and stacks of changesets. Print connection config for Claude Code, Codex, Antigravity, or Cursor via `node scripts/factory/sandbox-auth.mjs mcp-guide`.
- **One-time sandbox credentials**: Mint single-use, TTL-bounded tokens for sandboxed agents via `node scripts/factory/sandbox-auth.mjs mint`. Never pass credentials on argv.
- **Shared object store and trust boundary**: Builds share `https://build.smithers.sh` with split read/write secrets (`SMITHERS_CACHE_READ_TOKEN` vs `SMITHERS_CACHE_WRITE_TOKEN`). Untrusted runs are welcomed and receive read-only cache hits, but can never write cache artifacts or skip gates.
- **Knowledge surfaces**: Read [`.smithers/wiki/README.md`](.smithers/wiki/README.md) for subsystem architecture and ADRs, [`.smithers/history/MYTHICAL.md`](.smithers/history/MYTHICAL.md) for the repository chronicle, and `.agents/uphill/rules.md` for Lighthouse backpressure rules.

