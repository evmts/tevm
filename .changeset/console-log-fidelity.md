---
"@tevm/utils": patch
"@tevm/node": patch
---

Preserve leading NUL and U+FEFF characters in Solidity console strings. Raw JSON-RPC requests and batches now drain console logs based on their top-level method names, including JSON-escaped names.
