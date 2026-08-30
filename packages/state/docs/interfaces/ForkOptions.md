[**@tevm/state**](../README.md)

***

[@tevm/state](../globals.md) / ForkOptions

# Interface: ForkOptions

Defined in: [packages/state/src/state-types/ForkOptions.ts:29](https://github.com/evmts/tevm/blob/main/packages/state/src/state-types/ForkOptions.ts#L29)

Configuration options for forking from an existing blockchain network.
Used to specify the RPC endpoint and block number to fork from.

## Examples

```typescript
import { ForkOptions } from '@tevm/state'
import { http } from 'viem'

const value: ForkOptions = {
  transport: http('https://mainnet.infura.io/v3/your-api-key'),
  blockTag: 'latest'
}
```

```typescript
// Override chain ID to avoid wallet confusion when forking
import { ForkOptions } from '@tevm/state'
import { http } from 'viem'

const value: ForkOptions = {
  transport: http('https://mainnet.optimism.io'),
  chainId: 1337, // Use a custom chain ID instead of Optimism's 10
}
```

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="blockhash"></a> `blockHash?` | `` `0x${string}` `` | - | [packages/state/src/state-types/ForkOptions.ts:32](https://github.com/evmts/tevm/blob/main/packages/state/src/state-types/ForkOptions.ts#L32) |
| <a id="blocktag"></a> `blockTag?` | `bigint` \| `BlockTag` | - | [packages/state/src/state-types/ForkOptions.ts:31](https://github.com/evmts/tevm/blob/main/packages/state/src/state-types/ForkOptions.ts#L31) |
| <a id="chainid"></a> `chainId?` | `number` | Optional chain ID override. When set, this chain ID will be used instead of the one fetched from the fork RPC. This is useful to avoid wallet confusion (e.g., MetaMask) when the same chain ID is used for both the fork and the original network. **Example** `const client = createMemoryClient({ fork: { transport: http('https://mainnet.optimism.io'), chainId: 1337, // Override Optimism's chain ID (10) with a custom one }, })` | [packages/state/src/state-types/ForkOptions.ts:48](https://github.com/evmts/tevm/blob/main/packages/state/src/state-types/ForkOptions.ts#L48) |
| <a id="transport"></a> `transport` | \{ `request`: `EIP1193RequestFn`\<`any`\>; \} \| `Transport` | - | [packages/state/src/state-types/ForkOptions.ts:30](https://github.com/evmts/tevm/blob/main/packages/state/src/state-types/ForkOptions.ts#L30) |
