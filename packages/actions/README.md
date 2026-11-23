# @tevm/actions

Browser-safe helpers over native ZEVM JSON-RPC. These functions encode calls and decode results; all EVM execution and state remain in the native server.

```js
import { tevmCall } from '@tevm/actions'
import { createPublicClient, http } from 'viem'

const client = createPublicClient({ transport: http('http://127.0.0.1:8545') })
console.log(await tevmCall(client, { to: '0x0000000000000000000000000000000000000123' }))
```

For an embedded Node.js engine use `createMemoryClient` from `@tevm/memory-client`. It binds these helpers to its native transport.

`tevmContract` uses the supplied arguments to select the overload for both calldata and return decoding. `tevmSetAccount` accepts storage slots and values as hex quantities or hex data up to 32 bytes and sends each as a left-padded 32-byte word.

Simulated calls accept runtime bytecode in `code`, including actions built with `withCode`. The call applies the code to the destination and preserves other account overrides. An addressless simulation uses the zero address. Submitting a transaction requires a sender or an account supplied by the node. With `addToBlockchain`, a pending transaction after mining or a reverted receipt throws an error carrying `txHash`.
