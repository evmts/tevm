# @tevm/memory-client

Viem public, wallet, test, and TEVM convenience actions over an isolated native ZEVM engine.

```js
import { createMemoryClient } from '@tevm/memory-client'
const client = createMemoryClient()
try {
  console.log(await client.getBlockNumber())
  await client.tevmMine({ blocks: 2 })
  console.log(await client.getBlockNumber())
} finally {
  await client.tevmClose()
}
```

`createTevmTransport` attaches the engine at `client.transport.tevm`. Account helpers, ABI calls, deployment, mining, dump/load and snapshots operate on native state. See the [migration guide](../../docs/native-engine-migration.md).
