---
"@tevm/actions": patch
"@tevm/base-bundler": patch
"@tevm/bun-plugin": patch
"@tevm/bundler-cache": patch
"@tevm/common": patch
"@tevm/compiler": patch
"@tevm/config": patch
"@tevm/contract": patch
"@tevm/effect": patch
"@tevm/errors": patch
"@tevm/esbuild-plugin": patch
"@tevm/ethers": patch
"@tevm/http-client": patch
"@tevm/jsonrpc": patch
"@tevm/logger": patch
"@tevm/lsp": patch
"@tevm/mcp": patch
"@tevm/memory-client": patch
"@tevm/node": patch
"@tevm/predeploys": patch
"@tevm/requirejs-plugin": patch
"@tevm/resolutions": patch
"@tevm/resolutions-rs": patch
"@tevm/rollup-plugin": patch
"@tevm/rspack-plugin": patch
"@tevm/runtime": patch
"@tevm/runtime-rs": patch
"@tevm/server": patch
"@tevm/solc": patch
"@tevm/test-utils": patch
"@tevm/ts-plugin": patch
"@tevm/tsconfig": patch
"@tevm/tsupconfig": patch
"@tevm/unplugin": patch
"@tevm/utils": patch
"@tevm/viem": patch
"@tevm/vite-plugin": patch
"@tevm/webpack-plugin": patch
"@tevm/whatsabi": patch
"tevm": patch
"tevm-run": patch
---

Graduate the tested release candidate to the stable tevm 1.0.0 release. Every published package in the linked group is versioned together so that `tevm` and the `@tevm/*` entry points documented in the migration guide all resolve to `1.0.0`.
