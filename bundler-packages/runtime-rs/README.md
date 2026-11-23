# @tevm/runtime-rs

Rust implementation of the Tevm runtime.

## Installation

```bash
npm install @tevm/runtime-rs
# or
yarn add @tevm/runtime-rs
# or
pnpm add @tevm/runtime-rs
```

## Usage

```js
const { generateRuntimeJs } = require('@tevm/runtime-rs');

const contracts = { Token: { abi: [], evm: { bytecode: { object: '6000' } } } };
const source = generateRuntimeJs(JSON.stringify(contracts), 'mjs', true, '@tevm/contract');
console.log(source);
```

The generator accepts an object keyed by contract name or an array of name–artifact pairs.
CJS, MJS, TS, and declaration output use the same export names and sort by original artifact name.
Names that cannot be used as bindings, and the reserved names `artifacts`, `createContract`,
and `__proto__`, use `Tevm$` followed by the hexadecimal UTF-8 bytes of the name. An extra
`$` is appended until the alias is free. The `artifacts` export retains every original key.

## Development

### Building

```bash
npm run build
```

### Running tests

```bash
npm test
```