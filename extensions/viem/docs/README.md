**@tevm/viem**

***

# @tevm/viem

TEVM actions over native ZEVM JSON-RPC. `createMemoryClient` already includes these actions. Use `tevmViemExtension` to attach them to another viem client.

```js
import { tevmViemExtension } from '@tevm/viem'
import { createPublicClient, http } from 'viem'

const client = createPublicClient({
  transport: http('http://127.0.0.1:8545'),
}).extend(tevmViemExtension())
await client.tevmMine({ blocks: 1 })
console.log(await client.getBlockNumber())
```

`createTevmTransport` from `@tevm/memory-client` creates an embedded native transport in Node.js. Browser applications should connect to a running native server with viem's HTTP transport.
