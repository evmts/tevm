# @tevm/jsonrpc

Lightweight JSON-RPC 2.0 request/response types and client adapter utilities for Tevm.

## Installation

```bash
pnpm add @tevm/jsonrpc
```

## Usage

```ts
import { createJsonRpcFetcher } from '@tevm/jsonrpc'
import { createPublicClient, custom } from 'viem'

const client = createPublicClient({ transport: custom({ request: async () => '0x7a69' }) })
const fetcher = createJsonRpcFetcher(client)
const response = await fetcher.request({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
console.log(response) // { jsonrpc: '2.0', method: 'eth_chainId', result: '0x7a69', id: 1 }
```

For provider failures, the adapter returns the JSON-RPC error code, message, and optional `data`, including when viem wraps an HTTP error envelope.

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)
