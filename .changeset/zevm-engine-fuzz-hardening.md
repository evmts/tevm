---
"@tevm/node": patch
---

Harden `createZevmEngine` teardown and block events for pluggable backends. A failed fork or mining initialization now rejects `ready()` with the initialization error even when `backend.close()` also throws, closes the backend once, and no longer leaks a poll timer when a `block` listener is added during that cleanup. A `block` subscription made while a request is in flight no longer replays blocks mined before it, and a failed `eth_getBlockByNumber` is retried instead of skipping blocks. `request()` rejects with `backend returned an invalid JSON-RPC response` instead of resolving `undefined` when a backend returns a non-object or result-less response. `close()` emits `close` and removes listeners even when `backend.close()` rejects.
