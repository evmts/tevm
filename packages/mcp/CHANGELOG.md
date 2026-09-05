# @tevm/mcp

## 1.0.0-rc.154

### Major Changes

- 138aae1: Replace the JavaScript execution stack with ZEVM's native node, built from sibling ZEVM, Voltaire and Guillotine Mini sources. Expose serialized JSON-RPC and lifecycle/block events, viem memory clients, ethers integration, and HTTP/WebSocket/IPC servers. Remove EthereumJS dependencies and the old internal VM/state/transaction packages and facade exports.

  This is a breaking engine and public API migration. Native addons are required for in-process execution; browsers connect through JSON-RPC. State dumps, CLI sessions and direct mutable engine APIs change. See `docs/native-engine-migration.md` for supported replacements and removed surfaces.

### Patch Changes

- 42a8f85: Graduate the tested release candidate to the stable tevm 1.0.0 release. Every published package in the linked group is versioned together so that `tevm` and the `@tevm/*` entry points documented in the migration guide all resolve to `1.0.0`.
- Updated dependencies [138aae1]
- Updated dependencies [42a8f85]
  - @tevm/memory-client@1.0.0-rc.154
  - @tevm/common@1.0.0-rc.154
