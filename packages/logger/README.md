# @tevm/logger

Lightweight [pino](https://getpino.io) logger wrapper used across Tevm packages.

## Installation

```bash
pnpm add @tevm/logger
```

## Usage

```ts
import { createLogger } from '@tevm/logger'

const logger = createLogger({ name: 'tevm', level: 'info' })
logger.info('Tevm initialized')
```

## Documentation

Visit [tevm.sh](https://tevm.sh/) for full documentation.

## License

[MIT](./LICENSE)
