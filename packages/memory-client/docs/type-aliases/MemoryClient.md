[**@tevm/memory-client**](../README.md)

***

[@tevm/memory-client](../globals.md) / MemoryClient

# Type Alias: MemoryClient

> **MemoryClient** = `Client`\<`Transport`\<`"tevm"`, \{ `tevm`: `ZevmEngine`; \}\>, `Chain`, `Account` \| `undefined`\> & `PublicActions` & `WalletActions`\<`Chain`, `Account` \| `undefined`\> & `TestActions` & `ReturnType`\<`ReturnType`\<*typeof* [`tevmViemActions`](../functions/tevmViemActions.md)\>\>

Defined in: [packages/memory-client/src/MemoryClient.ts:6](https://github.com/evmts/tevm/blob/main/packages/memory-client/src/MemoryClient.ts#L6)

Viem client whose transport delegates all execution to a native ZEVM node.
