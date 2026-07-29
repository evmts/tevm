---
"@tevm/server": minor
---

Add a WebSocket JSON-RPC transport served on the same port as HTTP, with eth_subscribe and eth_unsubscribe wired so newHeads, logs and pending-transaction subscriptions push notifications to connected clients.
