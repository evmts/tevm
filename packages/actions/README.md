# @tevm/actions

Browser-safe helpers over native ZEVM JSON-RPC. These functions encode calls and decode results; all EVM execution and state remain in the native server.

```js
import { tevmCall } from '@tevm/actions'
import { createPublicClient, http } from 'viem'

const client = createPublicClient({ transport: http('http://127.0.0.1:8545') })
console.log(await tevmCall(client, { to: '0x0000000000000000000000000000000000000123' }))
```

For an embedded Node.js engine use `createMemoryClient` from `@tevm/memory-client`. It binds these helpers to its native transport.
