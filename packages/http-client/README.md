# @tevm/http-client

Connect to a TEVM JSON-RPC server backed by native ZEVM. The server owns execution and state; the client sends standard Ethereum and Anvil RPC requests.

```js
import { createHttpClient } from '@tevm/http-client'

const client = createHttpClient({ url: 'http://127.0.0.1:8545' })
console.log(await client.getBlockNumber())
console.log(await client.tevmGetAccount({
  address: '0x0000000000000000000000000000000000000123',
}))
```

Run `pnpm native:server` in the repository to start the native server. Browser applications can use `createPublicClient` and `http` from `viem` directly.
