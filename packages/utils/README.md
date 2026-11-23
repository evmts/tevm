# @tevm/utils

Shared Ethereum ABI, hex/byte encoding, signature, invariant, and prefunded-account utilities for Tevm.

## Installation

Available via `tevm/utils` or as a standalone package:

```bash
pnpm add @tevm/utils viem
```

## Usage

```ts
import { PREFUNDED_ACCOUNTS, invariant, parseAbi, toHex } from '@tevm/utils'

invariant(PREFUNDED_ACCOUNTS.length > 0, 'Expected default prefunded accounts')
console.log(PREFUNDED_ACCOUNTS[0].address)
console.log(toHex(42n))
console.log(parseAbi(['function answer() view returns (uint256)']))
```

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)
