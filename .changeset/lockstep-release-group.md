---
"@tevm/errors": patch
"@tevm/memory-client": patch
"@tevm/node": patch
"tevm": patch
---

Prevent issue #2097 package version skew permanently by moving the TEVM release group to lockstep (`fixed`) versioning, aligning `tevm` facade declarations with the thin ZEVM architecture, fixing standalone package runtime dependencies and `viem@^2.58.4` portability, and adding a minimal pluggable `backend` option (`ZevmBackend`) on `createZevmEngine` / `createMemoryClient` for WASM-based EVMs and custom JSON-RPC backends.
