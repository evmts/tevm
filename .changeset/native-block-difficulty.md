---
"@tevm/node": patch
---

Pin ZEVM's block response fix so native JSON-RPC always includes canonical `difficulty` and `totalDifficulty` quantities, including `"0x0"` for dev blocks.
