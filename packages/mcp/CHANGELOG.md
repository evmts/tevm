# @tevm/mcp

## 1.0.0-rc.155

### Patch Changes

- @tevm/common@1.0.0-rc.155
- @tevm/memory-client@1.0.0-rc.155

## 1.0.0-rc.154

### Major Changes

- 138aae1: Replace the JavaScript execution stack with ZEVM's native node, built from sibling ZEVM, Voltaire and Guillotine Mini sources. Expose serialized JSON-RPC and lifecycle/block events, viem memory clients, ethers integration, and HTTP/WebSocket/IPC servers. Remove EthereumJS dependencies and the old internal VM/state/transaction packages and facade exports.

  This is a breaking engine and public API migration. Native addons are required for in-process execution; browsers connect through JSON-RPC. State dumps, CLI sessions and direct mutable engine APIs change. See `docs/native-engine-migration.md` for supported replacements and removed surfaces.

### Patch Changes

- 30e5e79: - ZEVM validates RPC responses, isolates observer failures, and uses the submitted request for response events and Solidity console logs. The native backend loads in CommonJS, and the `tevm` facade exports the engine event types. With an injected backend or engine and no configured chain, `client.chain` is undefined. Use `client.getChainId()` to read the ID.
  - HTTP enforces byte limits on request bodies. IPC and WebSocket servers throw `RangeError` at construction for invalid subscription limits, accept `Infinity` for unlimited subscriptions, and clean up expired filters. MCP tools distinguish pending transactions from mined receipts. Error serialization and cause traversal handle circular references.
  - Solidity tooling preserves rooted remappings, resolves imports from Solidity syntax, and retains anonymous events in generated bindings and declarations. Matching bundled solc versions load locally. Declaration sidecars allow Solidity compilation, and proxy ABI resolution keeps the requested account’s address and bytecode together.
  - `tevm-run` forwards script arguments and logs only the script path.
- 12f49fd: Fix three edge-case bugs uncovered by the new multi-engine fuzz suite:
  - `@tevm/node`: return canonical JSON-RPC `-32700` Parse error when raw `engine.rpc` input contains unescaped NUL bytes instead of throwing a C-string FFI `TypeError`.
  - `@tevm/server`: enforce `maxBodySize` on trailing incomplete UTF-8 byte sequences flushed by `StringDecoder.end()` in `getRequestBody`.
  - `@tevm/mcp`: guard `toolSchemas` lookup with `Object.hasOwn` in `executeTool` so prototype property names (`__proto__`, `constructor`, `toString`) cleanly reject as unknown tools, and guard zero-length tail slicing in `evm_trace_call`.

- 48b37fa: Harden package manifests, exports, documentation, and runtime hygiene for publishing:
  - Fix blank-line and Windows path handling in `@tevm/config` `remappings.txt` loading
  - Remove stray debug `console.log` from `@tevm/unplugin` and stale debug scripts from `@tevm/viem` and `@tevm/ts-plugin`
  - Add CommonJS `require` export mapping to `@tevm/mcp` so `publint --strict` and `attw --pack` pass across ESM and CJS
  - Remove unused runtime and development dependencies across `@tevm/server`, `@tevm/http-client`, `@tevm/actions`, `@tevm/viem`, and `@tevm/cli`
  - Sync `tevm/jsr.json` exports with the native ZEVM facade surface and update package READMEs and descriptions

- 42a8f85: Graduate the tested release candidate to the stable tevm 1.0.0 release. Every published package in the linked group is versioned together so that `tevm` and the `@tevm/*` entry points documented in the migration guide all resolve to `1.0.0`.
- Updated dependencies [30e5e79]
- Updated dependencies [f3fee97]
- Updated dependencies [6401089]
- Updated dependencies [138aae1]
- Updated dependencies [42a8f85]
  - @tevm/memory-client@1.0.0-rc.154
  - @tevm/common@1.0.0-rc.154
