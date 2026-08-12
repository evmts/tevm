---
"@tevm/common": patch
---

Guard against a chain viem removes breaking every `@tevm/common` import

Each generated preset imports its chain by name from `viem/chains`, so a chain viem retires turns `import '@tevm/common'` into an uncatchable ESM `SyntaxError` for every consumer — and `viem` is a peer dependency, so they cannot resolve around it. `@tevm/common@1.0.0-next.148` shipped in that state for `ekta`, `ektaTestnet`, `seiDevnet` and `zircuitTestnet`.

Adds a test that fails if any preset imports a chain viem no longer exports, and makes the preset generator skip retired chains and delete their stale files instead of crashing on `undefined`. No generated output changes.
