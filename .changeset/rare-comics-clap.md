---
"@tevm/tsconfig": patch
"@tevm/tsupconfig": patch
"@tevm/viem": patch
"@tevm/actions": patch
"@tevm/contract": patch
"@tevm/errors": patch
"@tevm/http-client": patch
"@tevm/jsonrpc": patch
"@tevm/memory-client": patch
"@tevm/predeploys": patch
"@tevm/server": patch
"tevm": patch
---

- Renamed MemoryTevm MemoryClient
- Renamed TevmClient HttpClient
- Replaced @tevm/actions package with @tevm/actions, @tevm/client-types, and @tevm/procedures packages
- Moved errors to @tevm/errors
- Moved bundler packages out of tevm and to @tevm/bundler package
- Minimized packages exposed in tevm package
- Fixed bug with missing types exports
