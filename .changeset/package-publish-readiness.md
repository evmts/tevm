---
"@tevm/actions": patch
"@tevm/cli": patch
"@tevm/config": patch
"@tevm/contract": patch
"@tevm/effect": patch
"@tevm/errors": patch
"@tevm/http-client": patch
"@tevm/jsonrpc": patch
"@tevm/logger": patch
"@tevm/mcp": patch
"@tevm/node": patch
"@tevm/predeploys": patch
"@tevm/rollup-plugin": patch
"@tevm/server": patch
"@tevm/ts-plugin": patch
"@tevm/unplugin": patch
"@tevm/utils": patch
"@tevm/viem": patch
"@tevm/vite-plugin": patch
"@tevm/whatsabi": patch
"tevm": patch
"tevm-run": patch
---

Harden package manifests, exports, documentation, and runtime hygiene for publishing:

- Fix blank-line and Windows path handling in `@tevm/config` `remappings.txt` loading
- Remove stray debug `console.log` from `@tevm/unplugin` and stale debug scripts from `@tevm/viem` and `@tevm/ts-plugin`
- Add CommonJS `require` export mapping to `@tevm/mcp` so `publint --strict` and `attw --pack` pass across ESM and CJS
- Remove unused runtime and development dependencies across `@tevm/server`, `@tevm/http-client`, `@tevm/actions`, `@tevm/viem`, and `@tevm/cli`
- Sync `tevm/jsr.json` exports with the native ZEVM facade surface and update package READMEs and descriptions
