---
"@tevm/mcp": patch
"@tevm/node": patch
"@tevm/server": patch
---

Fix three edge-case bugs uncovered by the new multi-engine fuzz suite:

- `@tevm/node`: return canonical JSON-RPC `-32700` Parse error when raw `engine.rpc` input contains unescaped NUL bytes instead of throwing a C-string FFI `TypeError`.
- `@tevm/server`: enforce `maxBodySize` on trailing incomplete UTF-8 byte sequences flushed by `StringDecoder.end()` in `getRequestBody`.
- `@tevm/mcp`: guard `toolSchemas` lookup with `Object.hasOwn` in `executeTool` so prototype property names (`__proto__`, `constructor`, `toString`) cleanly reject as unknown tools, and guard zero-length tail slicing in `evm_trace_call`.
