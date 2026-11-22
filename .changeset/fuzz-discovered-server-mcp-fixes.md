---
"@tevm/mcp": patch
"@tevm/server": patch
---

Fix two edge-case bugs uncovered by the new multi-engine fuzz suite:

- `@tevm/server`: enforce `maxBodySize` on trailing incomplete UTF-8 byte sequences flushed by `StringDecoder.end()` in `getRequestBody`.
- `@tevm/mcp`: guard `toolSchemas` lookup with `Object.hasOwn` in `executeTool` so prototype property names (`__proto__`, `constructor`, `toString`) cleanly reject as unknown tools, and guard zero-length tail slicing in `evm_trace_call`.
