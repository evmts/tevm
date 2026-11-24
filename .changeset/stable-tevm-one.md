---
"@tevm/actions": patch
"@tevm/common": patch
"@tevm/contract": patch
"@tevm/errors": patch
"@tevm/http-client": patch
"@tevm/jsonrpc": patch
"@tevm/mcp": patch
"@tevm/memory-client": patch
"@tevm/node": patch
"@tevm/predeploys": patch
"@tevm/server": patch
"@tevm/tsconfig": patch
"@tevm/tsupconfig": patch
"@tevm/utils": patch
"@tevm/viem": patch
"tevm": patch
---

Graduate the tested release candidate to the stable tevm 1.0.0 release. Every published package in the linked group is versioned together so that `tevm` and the `@tevm/*` entry points documented in the migration guide all resolve to `1.0.0`.
