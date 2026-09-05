---
"tevm": major
"@tevm/node": major
"@tevm/memory-client": major
"@tevm/actions": major
"@tevm/common": major
"@tevm/server": major
"@tevm/utils": major
"@tevm/errors": major
"@tevm/viem": major
"@tevm/ethers": major
"@tevm/http-client": major
"@tevm/predeploys": major
"@tevm/cli": major
"@tevm/mcp": major
"tevm-run": patch
---

Replace the JavaScript execution stack with ZEVM's native node, built from sibling ZEVM, Voltaire and Guillotine Mini sources. Expose serialized JSON-RPC and lifecycle/block events, viem memory clients, ethers integration, and HTTP/WebSocket/IPC servers. Remove EthereumJS dependencies and the old internal VM/state/transaction packages and facade exports.

This is a breaking engine and public API migration. Native addons are required for in-process execution; browsers connect through JSON-RPC. State dumps, CLI sessions and direct mutable engine APIs change. See `docs/native-engine-migration.md` for supported replacements and removed surfaces.
