# @tevm/errors

Structured JSON-RPC, EVM, input validation, and client error classes for Tevm, all extending `BaseError`.

## Installation

Available via `tevm/errors` or as a standalone package:

```bash
pnpm add @tevm/errors
```

## Usage

```ts
import { BaseError, NoSignerAvailableError } from '@tevm/errors'

const error = new NoSignerAvailableError('No unlocked signer available for transaction')
console.log(error instanceof BaseError, error.code, error.name)
```

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)
