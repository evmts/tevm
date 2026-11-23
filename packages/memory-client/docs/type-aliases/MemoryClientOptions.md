[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / MemoryClientOptions

# Type Alias: MemoryClientOptions

> **MemoryClientOptions** = `ZevmEngineOptions` & `object`

Defined in: [packages/memory-client/src/MemoryClientOptions.ts:5](https://github.com/evmts/tevm/blob/main/packages/memory-client/src/MemoryClientOptions.ts#L5)

ZEVM engine (native or pluggable WASM backend) and viem client options. tevmClose also closes a supplied engine.

## Type Declaration

### account?

> `optional` **account?**: `Account` \| `Hex`

### common?

> `optional` **common?**: `Chain`

Chain reported as `client.chain`. Defaults to Foundry's chain (ID 31337, or `chainId`).
With an injected `backend` or `engine` and neither `common` nor `chainId`, `client.chain`
is `undefined`. Read the chain ID with `client.getChainId()`.

### consoleLog?

> `optional` **consoleLog?**: `boolean` \| `ConsoleLogHandler`

Print Hardhat `console.log` output from Solidity. `true` writes each message with
`console.log`; a function receives each message with its raw calldata and decoded
arguments. Forwarded to `createZevmEngine`; ignored when `engine` is supplied, so
configure that engine directly. Decoded messages are also emitted as `consoleLog`
events on `client.transport.tevm.events`.

#### Example

```ts
import { createMemoryClient } from '@tevm/memory-client'
const client = createMemoryClient({ consoleLog: (message) => console.log(`[sol] ${message}`) })
await client.tevmClose()
```

### engine?

> `optional` **engine?**: `ZevmEngine`

### key?

> `optional` **key?**: `string`

### name?

> `optional` **name?**: `string`
