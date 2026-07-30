---
"@tevm/blockchain": patch
"@tevm/utils": major
"@tevm/vm": patch
"tevm": major
---

Remove the backward-compatibility `GenesisState` and `AsyncEventEmitter` type exports and the incorrectly cased `bytesToBigint` alias from `@tevm/utils`. Internal consumers now use the canonical `GenesisState`, `EventEmitter`, and `bytesToBigInt` sources.
