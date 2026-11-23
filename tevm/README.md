# tevm

[![npm version](https://img.shields.io/npm/v/tevm?style=flat)](https://www.npmjs.com/package/tevm)
[![npm downloads](https://img.shields.io/npm/dm/tevm.svg)](https://www.npmjs.com/package/tevm)

Thin Ethereum development toolkit wrapping [ZEVM](https://github.com/evmts/zevm) with pluggable native and WASM EVM backend support (Voltaire primitives/state and Guillotine Mini bytecode execution).

- Thin wrapper over ZEVM's native Node-API addon (`>=24`) or any pluggable WASM-based EVM (`backend: { rpc(json), close() }`)
- Full [viem](https://viem.sh) public, wallet, test, and TEVM convenience actions via `createMemoryClient`
- HTTP, WebSocket, and IPC JSON-RPC server via `tevm/server` (or in-process WASM execution via `backend`)
- Direct Solidity imports and type generation via `tevm/bundler/*` plugins

## Installation

```bash
pnpm add tevm viem
```

## Quick start

```ts
import { createMemoryClient } from 'tevm'
import { parseAbi } from 'viem'

const client = createMemoryClient()
try {
  const address = '0x0000000000000000000000000000000000000123'
  await client.tevmSetAccount({
    address,
    deployedBytecode: '0x602a60005260206000f3',
  })

  const result = await client.tevmContract({
    address,
    abi: parseAbi(['function answer() view returns (uint256)']),
    functionName: 'answer',
  })

  console.log(result.data) // 42n
} finally {
  await client.tevmClose()
}
```

## Subpath exports

- `tevm` — `createMemoryClient`, `createZevmEngine`, `createTevmNode`, `createContract`, utilities
- `tevm/node` — Thin ZEVM engine wrapper with pluggable native & WASM backend support (`createZevmEngine`, `ZevmBackend`, `NativeRpcError`)
- `tevm/memory-client` — Viem client and transport over a native ZEVM or pluggable WASM EVM backend
- `tevm/actions` — Browser-safe JSON-RPC helpers (`tevmCall`, `tevmContract`, `tevmDeploy`, `tevmMine`, `tevmGetAccount`, `tevmSetAccount`, `tevmDeal`, `tevmDumpState`, `tevmLoadState`)
- `tevm/server` — HTTP, WebSocket, IPC, Express, and Next.js JSON-RPC servers
- `tevm/http-client` — Remote HTTP JSON-RPC client for a running TEVM server
- `tevm/common` — Viem chain definitions and `tevmDefault`
- `tevm/contract` — Type-safe contract action creators
- `tevm/errors` — Structured JSON-RPC, EVM, and client error classes
- `tevm/predeploys` — Type-safe predeploy contract definitions
- `tevm/utils` — Shared ABI, hex, and prefunded-account utilities
- `tevm/bundler/*` — Solidity bundler plugins (Vite, esbuild, Rollup, Webpack, Rspack, Bun)

## Documentation

- [Docs](https://tevm.sh/)
- [Native engine migration guide](../docs/native-engine-migration.md)
- [Contributing](../CONTRIBUTING.md)

## License

[MIT](./LICENSE)
