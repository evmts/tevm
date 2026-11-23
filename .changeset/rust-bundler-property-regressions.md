---
"@tevm/resolutions-rs": patch
"@tevm/runtime-rs": patch
"@tevm/solc-rs": patch
---

Fix stale and cyclic Solidity imports, preserve comments when rewriting import literals, and check remapped paths and file encodings. Generate stable contract exports for arbitrary artifact names. Preserve solc whole-file diagnostic offsets and CBOR settings, and report malformed compiler output.
