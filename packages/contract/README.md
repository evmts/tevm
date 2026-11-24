# @tevm/contract

Type-safe contract action creators and ABI wrappers for Tevm.

## Installation

Available via `tevm/contract` or as a standalone package:

```bash
pnpm add @tevm/contract viem
```

## Usage

```ts
import { createContract } from '@tevm/contract'

const Counter = createContract({
	name: 'Counter',
	humanReadableAbi: ['function count() view returns (uint256)', 'function increment()'],
	address: '0x0000000000000000000000000000000000000123',
})

const readParams = Counter.read.count()
console.log(readParams.functionName) // 'count'
console.log(Counter.write.increment.functionName) // 'increment'
```

When a name has both read and write overloads, each action creator includes the overloads with its own mutability.

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)

Read and write actions include `address` and `to` when a contract address is configured. Their readonly ABI contains the matching function overloads and the contract’s custom errors.
