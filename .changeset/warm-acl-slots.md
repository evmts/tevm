---
"@tevm/vm": patch
---

Fixed EIP-2930 access-list warming in runTx: the parsed access list holds raw bytes, and Uint8Array#toString() produced comma-joined keys the journal could never match, so listed addresses and storage slots were charged cold. Entries are now hex-encoded the way the journal expects; the bounded execution-spec conformance subset (eip2930_access_list) passes 50/50.
