# Tevm - JSR Edition

Tevm is a type-safe Ethereum development toolkit powered by the native [ZEVM](https://github.com/evmts/zevm) engine (Voltaire primitives/state + Guillotine Mini bytecode execution).

## Features

- **In-process native EVM** in Node.js (`>=24`) with upstream state forking
- **Viem-compatible client** with public, wallet, test, and TEVM convenience actions
- **HTTP, WebSocket, and IPC JSON-RPC servers** (browsers connect to a running native server over JSON-RPC)
- **Direct Solidity imports** with full TypeScript types via bundler plugins

## Installation

```bash
# Using npm / pnpm
pnpm add tevm viem

# Using JSR
jsr add @tevm/tevm
```

## Usage

```typescript
import { createMemoryClient } from '@tevm/tevm'
import { optimism } from '@tevm/tevm/common'
import { parseAbi, parseEther } from 'viem'

const client = createMemoryClient({
  common: optimism,
  fork: {
    url: 'https://mainnet.optimism.io',
  },
})

try {
  await client.tevmReady()

  const account = '0x000000000000000000000000000000000baD60A7'
  await client.tevmDeal({
    address: account,
    amount: parseEther('1'),
  })

  await client.tevmSetAccount({
    address: '0x0000000000000000000000000000000000000123',
    deployedBytecode: '0x602a60005260206000f3',
  })

  const result = await client.tevmContract({
    address: '0x0000000000000000000000000000000000000123',
    abi: parseAbi(['function answer() view returns (uint256)']),
    functionName: 'answer',
  })

  console.log(result.data) // 42n
  await client.tevmMine({ blocks: 1 })
} finally {
  await client.tevmClose()
}
```

## Documentation

For complete documentation, visit [https://tevm.sh](https://tevm.sh).

## License

MIT
