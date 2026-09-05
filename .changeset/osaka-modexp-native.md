---
"@tevm/node": patch
---

Document and verify native ModExp activation at the mainnet Osaka timestamp.
With the companion native changes, EIP-7823 rejects operands above 1,024 bytes
and EIP-7883 raises the minimum gas to 500. Pending calls before activation
retain Prague behavior. Regression coverage checks exact JSON-RPC results.
