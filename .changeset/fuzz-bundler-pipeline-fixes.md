---
"@tevm/config": patch
"@tevm/runtime": patch
"@tevm/resolutions": patch
---

Fix bundler pipeline bugs found by property and metamorphic fuzzing.

- `@tevm/config`: `remappings.txt` targets may contain `=` (only the first `=` separates prefix from target), an empty prefix such as `=lib/` is rejected with `InvalidRemappingsError` instead of remapping every import, and lone `\r` line endings are split.
- `@tevm/runtime`: contracts named after JavaScript reserved words or generated imports (`class`, `export`, `void`, `await`, `createContract`, `Contract`, ...) generate valid `ts`, `mjs` and `dts` modules through `export { _tevm_<name> as <name> }`.
- `@tevm/resolutions`: remapping targets containing `$` sequences (`$&`, `$'`, `$1`) are used literally, an import path ends at its matching quote (`import "./it's/A.sol"`), and an import that follows a block comment on the same line is rewritten as well as resolved.
