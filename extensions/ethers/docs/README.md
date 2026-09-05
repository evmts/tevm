**@tevm/ethers**

***

# @tevm/ethers

Ethers v6 integration with native ZEVM. `TevmProvider` wraps an isolated native node; `createEthersContract` attaches TEVM contract definitions to an ethers runner.

```js
import { TevmProvider } from '@tevm/ethers'

const provider = await TevmProvider.createMemoryProvider()
try {
  console.log(await provider.getBlockNumber())
  const signer = await provider.getSigner()
  console.log(await signer.getAddress())
} finally {
  provider.destroy()
}
```

The provider delegates JSON-RPC, signing, execution, mining, receipts and filters to ZEVM. Destroy the provider to release its native engine. For browser applications, use ethers' `JsonRpcProvider` with a running TEVM HTTP server.
