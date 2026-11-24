---
"@tevm/node": minor
"@tevm/memory-client": major
"@tevm/server": major
"@tevm/mcp": patch
"@tevm/errors": patch
"@tevm/contract": minor
"tevm": minor
---

- ZEVM validates RPC responses, isolates observer failures, and uses the submitted request for response events and Solidity console logs. The native backend loads in CommonJS, and the `tevm` facade exports the engine event types. With an injected backend or engine and no configured chain, `client.chain` is undefined. Use `client.getChainId()` to read the ID.
- HTTP enforces byte limits on request bodies. IPC and WebSocket servers throw `RangeError` at construction for invalid subscription limits, accept `Infinity` for unlimited subscriptions, and clean up expired filters. MCP tools distinguish pending transactions from mined receipts. Error serialization and cause traversal handle circular references.
- Solidity tooling preserves rooted remappings, resolves imports from Solidity syntax, and retains anonymous events in generated bindings and declarations. Matching bundled solc versions load locally. Declaration sidecars allow Solidity compilation, and proxy ABI resolution keeps the requested account’s address and bytecode together.
- `tevm-run` forwards script arguments and logs only the script path.
