[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / createTevmTransport

# Function: createTevmTransport()

> **createTevmTransport**(`options?`): `Transport`\<`"tevm"`, \{ `tevm`: `ZevmEngine`; \}, `EIP1193RequestFn`\>

Defined in: [packages/memory-client/src/createTevmTransport.js:16](https://github.com/evmts/tevm/blob/main/packages/memory-client/src/createTevmTransport.js#L16)

Create a viem transport over one isolated native engine. Retries are disabled
because replaying a mutation after a transport failure can execute it twice.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`MemoryClientOptions`](../type-aliases/MemoryClientOptions.md) | - |

## Returns

`Transport`\<`"tevm"`, \{ `tevm`: `ZevmEngine`; \}, `EIP1193RequestFn`\>

## Example

```ts
import { createClient } from 'viem'
import { createTevmTransport } from '@tevm/memory-client'
const client = createClient({ transport: createTevmTransport() })
await client.transport.tevm.ready()
await client.transport.tevm.close()
```
