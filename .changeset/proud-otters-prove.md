---
"@tevm/state": patch
---

Fork account hydration now falls back to eth_getBalance + eth_getTransactionCount + eth_getCode (pinned to the fork block) on providers that do not serve eth_getProof, such as Monad, ZKsync OS, and Moonbeam. The downgrade is detected once per fork transport and logged; fetched bytecode primes the contract code cache. Account existence detection accepts both zero-hash proof responses and canonical empty hashes produced by scalar hydration.
