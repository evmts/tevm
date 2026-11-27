---
"@tevm/node": minor
"@tevm/memory-client": minor
"tevm": minor
---

Add zero-config browser WebAssembly execution via `@evmts/zevm/browser`: `createZevmEngine()` and `createMemoryClient()` now automatically load ZEVM's compiled `zevm.wasm` reactor outside Node.js, accept a `wasm` option (`boolean | ArrayBuffer | ArrayBufferView | WebAssembly.Module`) to run WASM in any runtime, and export `createWasmBackend()`.
