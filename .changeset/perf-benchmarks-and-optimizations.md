---
"@tevm/base-bundler": patch
"@tevm/contract": patch
"@tevm/errors": patch
"@tevm/node": patch
"@tevm/resolutions": patch
"@tevm/server": patch
"tevm": patch
---

Optimize hot paths discovered by the new incremental package benchmark suite:

- `@tevm/contract`: remove per-call JSON-RPC metadata cloning and `Object.defineProperty` overhead in contract read/write/event action creators and `withAddress` (up to 14.8x faster write action creation and 3.1x faster read/event creation).
- `@tevm/server`: avoid repeated `Buffer.concat` allocations while buffering HTTP request bodies (6.9x faster on multi-chunk 64 KB payloads) and replace quadratic string slicing in IPC JSON-RPC frame extraction with an indexed scanner.
- `@tevm/node`: cache the native ZEVM constructor and fast-path idle `ready()`, `request()`, `rpc`, and `close()` calls without unnecessary listener allocations.
- `@tevm/base-bundler`: avoid redundant cache reads and fix concurrent cache-write races in `resolveModuleAsync` / `resolveModuleSync` (up to 2.6x faster warm cache resolution).
- `@tevm/errors` & `@tevm/resolutions`: trim repeated formatting and path-resolution overhead on hot paths.
