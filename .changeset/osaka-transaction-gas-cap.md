---
"@tevm/node": patch
---

Enforce Osaka's EIP-7825 transaction gas cap through the updated native ZEVM
runtime. Declared gas above 16,777,216 is rejected with JSON-RPC code -32000
before submission or signing; historical forks retain their prior limits.
Requires the accompanying ZEVM source update and a rebuilt native addon.
