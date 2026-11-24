---
"@tevm/memory-client": patch
"@tevm/node": patch
"@tevm/http-client": patch
"@tevm/predeploys": patch
"@tevm/tsupconfig": patch
"@tevm/contract": patch
"@tevm/tsconfig": patch
"@tevm/actions": patch
"@tevm/jsonrpc": patch
"@tevm/viem": patch
"@tevm/common": patch
"@tevm/errors": patch
"@tevm/server": patch
"@tevm/utils": patch
"tevm": patch
---

Moved files around to colocate code better. Some packages are disappearing

- Tevm/Zod is now part of Tevm/actions
- Tevm/actions-types moved to Tevm/actions
- Tevm/procedures-types moved to Tevm/procedures
