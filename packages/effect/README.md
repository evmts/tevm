# @tevm/effect

Low-level [Effect](https://effect.website) utilities shared across Tevm bundler and configuration packages (`fileExists`, `parseJson`, `resolve`, `createRequireEffect`, `logAllErrors`).

## Installation

```bash
pnpm add @tevm/effect effect
```

## Usage

```ts
import { parseJson } from '@tevm/effect'
import { Effect } from 'effect'

const parsed = Effect.runSync(parseJson('{"chainId":31337}'))
console.log(parsed)
```

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)
