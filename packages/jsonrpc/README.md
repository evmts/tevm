# @tevm/jsonrpc

Lightweight JSON-RPC 2.0 request/response types and client adapter utilities for Tevm.

## Installation

```bash
pnpm add @tevm/jsonrpc
```

## Usage

```ts
import { createJsonRpcFetcher } from '@tevm/jsonrpc'

const fetcher = createJsonRpcFetcher({
  request: async ({ method }) => (method === 'eth_chainId' ? '0x7a69' : null),
})

const response = await fetcher.request({ method: 'eth_chainId', id: 1 })
console.log(response) // { jsonrpc: '2.0', method: 'eth_chainId', result: '0x7a69', id: 1 }
```

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)
