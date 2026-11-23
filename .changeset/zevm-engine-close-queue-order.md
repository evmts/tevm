---
"@tevm/node": patch
---

Fix `createZevmEngine` queue ordering: `request()` and `rpc()` calls issued before `close()` in the same tick now complete before the engine closes instead of rejecting with `engine is closed`. Found by the new stateful differential fuzz suite that compares native ZEVM, an async pluggable backend and a reference model.
