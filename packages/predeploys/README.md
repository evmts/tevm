# @tevm/predeploys

`definePredeploy` associates a contract definition with a checksummed address. Install runtime bytecode explicitly in native ZEVM state; JavaScript precompile callbacks are no longer supported.

```js
import { createMemoryClient } from '@tevm/memory-client'

const client = createMemoryClient()
try {
  const address = '0x0000000000000000000000000000000000000123'
  await client.tevmSetAccount({
    address,
    deployedBytecode: '0x602a60005260206000f3',
  })
  console.log(await client.tevmCall({ to: address }))
} finally {
  await client.tevmClose()
}
```

Custom native precompiles belong in Guillotine Mini or Voltaire.
