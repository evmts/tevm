[**@tevm/mcp**](../README.md)

***

[@tevm/mcp](../globals.md) / createSessionManager

# Function: createSessionManager()

> **createSessionManager**(`options?`): `object`

Defined in: [packages/mcp/src/createSessionManager.js:34](https://github.com/evmts/tevm/blob/main/packages/mcp/src/createSessionManager.js#L34)

Creates an isolated Tevm session manager with idle expiration.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | \{ `idleTtlMs?`: `number`; `maximumSessions?`: `number`; `now?`: () => `number`; \} | Session limits. |
| `options.idleTtlMs?` | `number` | - |
| `options.maximumSessions?` | `number` | - |
| `options.now?` | () => `number` | - |

## Returns

`object`

A manager whose handles expire after the configured idle lifetime.

### close

> **close**: (`handle`) => `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handle` | `string` |

#### Returns

`boolean`

### createFork

> **createFork**: (`input`) => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `blockNumber?`: `string`; `chain?`: `"auto"` \| `"mainnet"` \| `"optimism"` \| `"base"`; `url`: `string`; \} |
| `input.blockNumber?` | `string` |
| `input.chain?` | `"auto"` \| `"mainnet"` \| `"optimism"` \| `"base"` |
| `input.url` | `string` |

#### Returns

`Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

### createLocal

> **createLocal**: () => `Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

#### Returns

`Promise`\<\{ `blockNumber`: `bigint`; `chainId`: `number`; `expiresAt`: `string`; `handle`: `string`; \}\>

### get

> **get**: (`handle`) => `object`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handle` | `string` |

#### Returns

##### account

> **account**: `Account` \| `undefined`

The Account of the Client.

##### addChain

> **addChain**: (`args`) => `Promise`\<`void`\>

Adds an EVM chain to the wallet.

- Docs: https://viem.sh/docs/actions/wallet/addChain
- JSON-RPC Methods: [`eth_addEthereumChain`](https://eips.ethereum.org/EIPS/eip-3085)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `AddChainParameters` | AddChainParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { optimism } from 'viem/chains'

const client = createWalletClient({
  transport: custom(window.ethereum),
})
await client.addChain({ chain: optimism })
```

##### batch?

> `optional` **batch?**: `object`

Flags for batch settings.

###### Type Declaration

###### batch.multicall?

> `optional` **multicall?**: `boolean` \| \{ `batchSize?`: `number`; `deployless?`: `boolean`; `wait?`: `number`; \}

Toggle to enable `eth_call` multicall aggregation.

###### Union Members

`boolean`

***

###### Type Literal

\{ `batchSize?`: `number`; `deployless?`: `boolean`; `wait?`: `number`; \}

###### batchSize?

> `optional` **batchSize?**: `number`

The maximum size (in bytes) for each calldata chunk.

###### Default

```ts
1_024
```

###### deployless?

> `optional` **deployless?**: `boolean`

Enable deployless multicall.

###### wait?

> `optional` **wait?**: `number`

The maximum number of milliseconds to wait before sending a batch.

###### Default

```ts
0
```

##### cacheTime

> **cacheTime**: `number`

Time (in ms) that cached data will remain in memory.

##### call

> **call**: (`parameters`) => `Promise`\<`CallReturnType`\>

Executes a new message call immediately without submitting a transaction to the network.

- Docs: https://viem.sh/docs/actions/public/call
- JSON-RPC Methods: [`eth_call`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_call)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `CallParameters`\<`Chain` \| `undefined`\> |

###### Returns

`Promise`\<`CallReturnType`\>

The call data. CallReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const data = await client.call({
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

##### ccipRead?

> `optional` **ccipRead?**: `false` \| \{ `request?`: (`parameters`) => `Promise`\<`` `0x${string}` ``\>; \}

[CCIP Read](https://eips.ethereum.org/EIPS/eip-3668) configuration.

###### Union Members

`false`

***

###### Type Literal

\{ `request?`: (`parameters`) => `Promise`\<`` `0x${string}` ``\>; \}

###### request?

> `optional` **request?**: (`parameters`) => `Promise`\<`` `0x${string}` ``\>

A function that will be called to make the offchain CCIP lookup request.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `CcipRequestParameters` |

###### Returns

`Promise`\<`` `0x${string}` ``\>

###### See

https://eips.ethereum.org/EIPS/eip-3668#client-lookup-protocol

##### chain

> **chain**: `Chain` \| `undefined`

Chain for the client.

##### createAccessList

> **createAccessList**: (`parameters`) => `Promise`\<\{ `accessList`: `AccessList`; `gasUsed`: `bigint`; \}\>

Creates an EIP-2930 access list that you can include in a transaction.

- Docs: https://viem.sh/docs/actions/public/createAccessList
- JSON-RPC Methods: `eth_createAccessList`

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `CreateAccessListParameters`\<`Chain` \| `undefined`\> |

###### Returns

`Promise`\<\{ `accessList`: `AccessList`; `gasUsed`: `bigint`; \}\>

The call data. CreateAccessListReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const data = await client.createAccessList({
  data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```

##### createBlockFilter

> **createBlockFilter**: () => `Promise`\<\{ `id`: `` `0x${string}` ``; `request`: `EIP1193RequestFn`\<readonly \[\{ `Method`: `"eth_getFilterChanges"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: ...[] \| ...[]; \}, \{ `Method`: `"eth_getFilterLogs"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `RpcLog`[]; \}, \{ `Method`: `"eth_uninstallFilter"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `boolean`; \}\]\>; `type`: `"block"`; \}\>

Creates a Filter to listen for new block hashes that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges).

- Docs: https://viem.sh/docs/actions/public/createBlockFilter
- JSON-RPC Methods: [`eth_newBlockFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newBlockFilter)

###### Returns

`Promise`\<\{ `id`: `` `0x${string}` ``; `request`: `EIP1193RequestFn`\<readonly \[\{ `Method`: `"eth_getFilterChanges"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: ...[] \| ...[]; \}, \{ `Method`: `"eth_getFilterLogs"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `RpcLog`[]; \}, \{ `Method`: `"eth_uninstallFilter"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `boolean`; \}\]\>; `type`: `"block"`; \}\>

Filter. CreateBlockFilterReturnType

###### Example

```ts
import { createPublicClient, createBlockFilter, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await createBlockFilter(client)
// { id: "0x345a6572337856574a76364e457a4366", type: 'block' }
```

##### createContractEventFilter

> **createContractEventFilter**: \<`abi`, `eventName`, `args`, `strict`, `fromBlock`, `toBlock`\>(`args`) => `Promise`\<`CreateContractEventFilterReturnType`\<`abi`, `eventName`, `args`, `strict`, `fromBlock`, `toBlock`\>\>

Creates a Filter to retrieve event logs that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges) or [`getFilterLogs`](https://viem.sh/docs/actions/public/getFilterLogs).

- Docs: https://viem.sh/docs/contract/createContractEventFilter

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] | - |
| `eventName` *extends* `string` \| `undefined` | - |
| `args` *extends* `Record`\<`string`, `unknown`\> \| readonly `unknown`[] \| `undefined` | - |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `fromBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `toBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `CreateContractEventFilterParameters`\<`abi`, `eventName`, `args`, `strict`, `fromBlock`, `toBlock`\> | CreateContractEventFilterParameters |

###### Returns

`Promise`\<`CreateContractEventFilterReturnType`\<`abi`, `eventName`, `args`, `strict`, `fromBlock`, `toBlock`\>\>

[`Filter`](https://viem.sh/docs/glossary/types#filter). CreateContractEventFilterReturnType

###### Example

```ts
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createContractEventFilter({
  abi: parseAbi(['event Transfer(address indexed, address indexed, uint256)']),
})
```

##### createEventFilter

> **createEventFilter**: \<`abiEvent`, `abiEvents`, `strict`, `fromBlock`, `toBlock`, `_EventName`, `_Args`\>(`args?`) => `Promise`\<\{ \[K in string \| number \| symbol\]: Filter\<"event", abiEvents, \_EventName, \_Args, strict, fromBlock, toBlock\>\[K\] \}\>

Creates a [`Filter`](https://viem.sh/docs/glossary/types#filter) to listen for new events that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges).

- Docs: https://viem.sh/docs/actions/public/createEventFilter
- JSON-RPC Methods: [`eth_newFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newfilter)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abiEvent` *extends* `AbiEvent` \| `undefined` | `undefined` |
| `abiEvents` *extends* readonly `unknown`[] \| readonly `AbiEvent`[] \| `undefined` | `abiEvent` *extends* `AbiEvent` ? \[`abiEvent`\] : `undefined` |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `fromBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `toBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `_EventName` *extends* `string` \| `undefined` | `MaybeAbiEventName`\<`abiEvent`\> |
| `_Args` *extends* `Record`\<`string`, `unknown`\> \| readonly `unknown`[] \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args?` | `CreateEventFilterParameters`\<`abiEvent`, `abiEvents`, `strict`, `fromBlock`, `toBlock`, `_EventName`, `_Args`\> | CreateEventFilterParameters |

###### Returns

`Promise`\<\{ \[K in string \| number \| symbol\]: Filter\<"event", abiEvents, \_EventName, \_Args, strict, fromBlock, toBlock\>\[K\] \}\>

[`Filter`](https://viem.sh/docs/glossary/types#filter). CreateEventFilterReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createEventFilter({
  address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
})
```

##### createPendingTransactionFilter

> **createPendingTransactionFilter**: () => `Promise`\<\{ `id`: `` `0x${string}` ``; `request`: `EIP1193RequestFn`\<readonly \[\{ `Method`: `"eth_getFilterChanges"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: ...[] \| ...[]; \}, \{ `Method`: `"eth_getFilterLogs"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `RpcLog`[]; \}, \{ `Method`: `"eth_uninstallFilter"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `boolean`; \}\]\>; `type`: `"transaction"`; \}\>

Creates a Filter to listen for new pending transaction hashes that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges).

- Docs: https://viem.sh/docs/actions/public/createPendingTransactionFilter
- JSON-RPC Methods: [`eth_newPendingTransactionFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newpendingtransactionfilter)

###### Returns

`Promise`\<\{ `id`: `` `0x${string}` ``; `request`: `EIP1193RequestFn`\<readonly \[\{ `Method`: `"eth_getFilterChanges"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: ...[] \| ...[]; \}, \{ `Method`: `"eth_getFilterLogs"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `RpcLog`[]; \}, \{ `Method`: `"eth_uninstallFilter"`; `Parameters`: \[`` `0x${(...)}` ``\]; `ReturnType`: `boolean`; \}\]\>; `type`: `"transaction"`; \}\>

[`Filter`](https://viem.sh/docs/glossary/types#filter). CreateBlockFilterReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createPendingTransactionFilter()
// { id: "0x345a6572337856574a76364e457a4366", type: 'transaction' }
```

##### dataSuffix?

> `optional` **dataSuffix?**: `DataSuffix`

Data suffix to append to transaction data.

##### deployContract

> **deployContract**: \<`abi`, `chainOverride`\>(`args`) => `Promise`\<`` `0x${string}` ``\>

Deploys a contract to the network, given bytecode and constructor arguments.

- Docs: https://viem.sh/docs/contract/deployContract
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts_deploying-contracts

###### Type Parameters

| Type Parameter |
| ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] |
| `chainOverride` *extends* `Chain` \| `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `DeployContractParameters`\<`abi`, `Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`\> | DeployContractParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

The [Transaction](https://viem.sh/docs/glossary/terms#transaction) hash. DeployContractReturnType

###### Example

```ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const hash = await client.deployContract({
  abi: [],
  account: '0x…,
  bytecode: '0x608060405260405161083e38038061083e833981016040819052610...',
})
```

##### dropTransaction

> **dropTransaction**: (`args`) => `Promise`\<`void`\>

Removes a transaction from the mempool.

- Docs: https://viem.sh/docs/actions/test/dropTransaction

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `DropTransactionParameters` | DropTransactionParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.dropTransaction({
  hash: '0xe58dceb6b20b03965bb678e27d141e151d7d4efc2334c2d6a49b9fac523f7364'
})
```

##### dumpState

> **dumpState**: () => `Promise`\<`` `0x${string}` ``\>

Serializes the current state (including contracts code, contract's storage,
accounts properties, etc.) into a savable data blob.

- Docs: https://viem.sh/docs/actions/test/dumpState

###### Returns

`Promise`\<`` `0x${string}` ``\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.dumpState()
```

##### estimateContractGas

> **estimateContractGas**: \<`chain`, `abi`, `functionName`, `args`\>(`args`) => `Promise`\<`bigint`\>

Estimates the gas required to successfully execute a contract write function call.

- Docs: https://viem.sh/docs/contract/estimateContractGas

###### Type Parameters

| Type Parameter |
| ------ |
| `chain` *extends* `Chain` \| `undefined` |
| `abi` *extends* `Abi` \| readonly `unknown`[] |
| `functionName` *extends* `string` |
| `args` *extends* `unknown` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `EstimateContractGasParameters`\<`abi`, `functionName`, `args`, `chain`\> | EstimateContractGasParameters |

###### Returns

`Promise`\<`bigint`\>

The gas estimate (in wei). EstimateContractGasReturnType

###### Remarks

Internally, uses a [Public Client](https://viem.sh/docs/clients/public) to call the [`estimateGas` action](https://viem.sh/docs/actions/public/estimateGas) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).

###### Example

```ts
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const gas = await client.estimateContractGas({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint() public']),
  functionName: 'mint',
  account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
})
```

##### estimateFeesPerGas

> **estimateFeesPerGas**: \<`chainOverride`, `type`\>(`args?`) => `Promise`\<`EstimateFeesPerGasReturnType`\<`type`\>\>

Returns an estimate for the fees per gas for a transaction to be included
in the next block.

- Docs: https://viem.sh/docs/actions/public/estimateFeesPerGas

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |
| `type` *extends* `FeeValuesType` | `"eip1559"` |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args?` | `EstimateFeesPerGasParameters`\<`Chain` \| `undefined`, `chainOverride`, `type`\> |

###### Returns

`Promise`\<`EstimateFeesPerGasReturnType`\<`type`\>\>

An estimate (in wei) for the fees per gas. EstimateFeesPerGasReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const maxPriorityFeePerGas = await client.estimateFeesPerGas()
// { maxFeePerGas: ..., maxPriorityFeePerGas: ... }
```

##### estimateGas

> **estimateGas**: (`args`) => `Promise`\<`bigint`\>

Estimates the gas necessary to complete a transaction without submitting it to the network.

- Docs: https://viem.sh/docs/actions/public/estimateGas
- JSON-RPC Methods: [`eth_estimateGas`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_estimategas)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `EstimateGasParameters`\<`Chain` \| `undefined`\> | EstimateGasParameters |

###### Returns

`Promise`\<`bigint`\>

The gas estimate (in wei). EstimateGasReturnType

###### Example

```ts
import { createPublicClient, http, parseEther } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const gasEstimate = await client.estimateGas({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1'),
})
```

##### estimateMaxPriorityFeePerGas

> **estimateMaxPriorityFeePerGas**: \<`chainOverride`\>(`args?`) => `Promise`\<`bigint`\>

Returns an estimate for the max priority fee per gas (in wei) for a transaction
to be included in the next block.

- Docs: https://viem.sh/docs/actions/public/estimateMaxPriorityFeePerGas

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args?` | \{ `chain`: `chainOverride` \| `null`; \} |
| `args.chain?` | `chainOverride` \| `null` |

###### Returns

`Promise`\<`bigint`\>

An estimate (in wei) for the max priority fee per gas. EstimateMaxPriorityFeePerGasReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const maxPriorityFeePerGas = await client.estimateMaxPriorityFeePerGas()
// 10000000n
```

##### experimental\_blockTag?

> `optional` **experimental\_blockTag?**: `BlockTag`

Default block tag to use for RPC requests.

##### extend

> **extend**: \<`client`\>(`fn`) => `Client`\<`TevmTransport`, `Chain` \| `undefined`, `Account` \| `undefined`, \[\{ `Method`: `"web3_clientVersion"`; `Parameters?`: `undefined`; `ReturnType`: `string`; \}, \{ `Method`: `"web3_sha3"`; `Parameters`: \[`` `0x${string}` ``\]; `ReturnType`: `string`; \}, \{ `Method`: `"net_listening"`; `Parameters?`: `undefined`; `ReturnType`: `boolean`; \}, \{ `Method`: `"net_peerCount"`; `Parameters?`: `undefined`; `ReturnType`: `` `0x${string}` ``; \}, \{ `Method`: `"net_version"`; `Parameters?`: `undefined`; `ReturnType`: `` `0x${string}` ``; \}\], \{ \[K in string \| number \| symbol\]: client\[K\] \} & `TevmActions` & `PublicActions`\<`TevmTransport`, `Chain` \| `undefined`, `Account` \| `undefined`\> & `WalletActions`\<`Chain` \| `undefined`, `Account` \| `undefined`\> & `TestActions`\>

###### Type Parameters

| Type Parameter |
| ------ |
| `client` *extends* `object` & `ExactPartial`\<`ExtendableProtectedActions`\<`TevmTransport`, `Chain` \| `undefined`, `Account` \| `undefined`\>\> |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | (`client`) => `client` |

###### Returns

`Client`\<`TevmTransport`, `Chain` \| `undefined`, `Account` \| `undefined`, \[\{ `Method`: `"web3_clientVersion"`; `Parameters?`: `undefined`; `ReturnType`: `string`; \}, \{ `Method`: `"web3_sha3"`; `Parameters`: \[`` `0x${string}` ``\]; `ReturnType`: `string`; \}, \{ `Method`: `"net_listening"`; `Parameters?`: `undefined`; `ReturnType`: `boolean`; \}, \{ `Method`: `"net_peerCount"`; `Parameters?`: `undefined`; `ReturnType`: `` `0x${string}` ``; \}, \{ `Method`: `"net_version"`; `Parameters?`: `undefined`; `ReturnType`: `` `0x${string}` ``; \}\], \{ \[K in string \| number \| symbol\]: client\[K\] \} & `TevmActions` & `PublicActions`\<`TevmTransport`, `Chain` \| `undefined`, `Account` \| `undefined`\> & `WalletActions`\<`Chain` \| `undefined`, `Account` \| `undefined`\> & `TestActions`\>

##### fillTransaction

> **fillTransaction**: \<`chainOverride`, `accountOverride`\>(`args`) => `Promise`\<`FillTransactionReturnType`\<`Chain` \| `undefined`, `chainOverride`\>\> & \<`chainOverride`, `accountOverride`\>(`args`) => `Promise`\<`FillTransactionReturnType`\<`Chain` \| `undefined`, `chainOverride`\>\>

Fills a transaction request with the necessary fields to be signed over.

- Docs: https://viem.sh/docs/actions/public/fillTransaction

###### Param

Client to use

###### Param

FillTransactionParameters

###### Returns

The filled transaction. FillTransactionReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const result = await client.fillTransaction({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: parseEther('1'),
})
```

##### getAddresses

> **getAddresses**: () => `Promise`\<`GetAddressesReturnType`\>

Returns a list of account addresses owned by the wallet or client.

- Docs: https://viem.sh/docs/actions/wallet/getAddresses
- JSON-RPC Methods: [`eth_accounts`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_accounts)

###### Returns

`Promise`\<`GetAddressesReturnType`\>

List of account addresses owned by the wallet or client. GetAddressesReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const accounts = await client.getAddresses()
```

##### getAutomine

> **getAutomine**: () => `Promise`\<`boolean`\>

Returns the automatic mining status of the node.

- Docs: https://viem.sh/docs/actions/test/getAutomine

###### Returns

`Promise`\<`boolean`\>

Whether or not the node is auto mining. GetAutomineReturnType

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
const isAutomining = await client.getAutomine()
```

##### getBalance

> **getBalance**: (`args`) => `Promise`\<`bigint`\>

Returns the balance of an address in wei.

- Docs: https://viem.sh/docs/actions/public/getBalance
- JSON-RPC Methods: [`eth_getBalance`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getbalance)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetBalanceParameters` | GetBalanceParameters |

###### Returns

`Promise`\<`bigint`\>

The balance of the address in wei. GetBalanceReturnType

###### Remarks

You can convert the balance to ether units with [`formatEther`](https://viem.sh/docs/utilities/formatEther).

```ts
const balance = await getBalance(client, {
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  blockTag: 'safe'
})
const balanceAsEther = formatEther(balance)
// "6.942"
```

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const balance = await client.getBalance({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
// 10000000000000000000000n (wei)
```

##### getBlobBaseFee

> **getBlobBaseFee**: () => `Promise`\<`bigint`\>

Returns the base fee per blob gas in wei.

- Docs: https://viem.sh/docs/actions/public/getBlobBaseFee
- JSON-RPC Methods: [`eth_blobBaseFee`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blobBaseFee)

###### Returns

`Promise`\<`bigint`\>

The blob base fee (in wei). GetBlobBaseFeeReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { getBlobBaseFee } from 'viem/public'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const blobBaseFee = await client.getBlobBaseFee()
```

##### getBlock

> **getBlock**: \<`includeTransactions`, `blockTag`\>(`args?`) => `Promise`\<\{ `baseFeePerGas`: `bigint` \| `null`; `blobGasUsed`: `bigint`; `difficulty`: `bigint`; `excessBlobGas`: `bigint`; `extraData`: `` `0x${string}` ``; `gasLimit`: `bigint`; `gasUsed`: `bigint`; `hash`: `blockTag` *extends* `"pending"` ? `null` : `` `0x${string}` ``; `logsBloom`: `blockTag` *extends* `"pending"` ? `null` : `` `0x${string}` ``; `miner`: `` `0x${string}` ``; `mixHash`: `` `0x${string}` ``; `nonce`: `blockTag` *extends* `"pending"` ? `null` : `` `0x${string}` ``; `number`: `blockTag` *extends* `"pending"` ? `null` : `bigint`; `parentBeaconBlockRoot?`: `` `0x${string}` ``; `parentHash`: `` `0x${string}` ``; `receiptsRoot`: `` `0x${string}` ``; `sealFields`: `` `0x${string}` ``[]; `sha3Uncles`: `` `0x${string}` ``; `size`: `bigint`; `stateRoot`: `` `0x${string}` ``; `timestamp`: `bigint`; `totalDifficulty`: `bigint` \| `null`; `transactions`: `includeTransactions` *extends* `true` ? (\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId?`: ... \| ...; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"legacy"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity?`: `undefined`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip2930"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip1559"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes`: readonly ...[]; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip4844"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip7702"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \})[] : `` `0x${string}` ``[]; `transactionsRoot`: `` `0x${string}` ``; `uncles`: `` `0x${string}` ``[]; `withdrawals?`: `Withdrawal`[]; `withdrawalsRoot?`: `` `0x${string}` ``; \}\>

Returns information about a block at a block number, hash, or tag.

- Docs: https://viem.sh/docs/actions/public/getBlock
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_fetching-blocks
- JSON-RPC Methods:
  - Calls [`eth_getBlockByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblockbynumber) for `blockNumber` & `blockTag`.
  - Calls [`eth_getBlockByHash`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblockbyhash) for `blockHash`.

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `includeTransactions` *extends* `boolean` | `false` |
| `blockTag` *extends* `BlockTag` | `"latest"` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args?` | `GetBlockParameters`\<`includeTransactions`, `blockTag`\> | GetBlockParameters |

###### Returns

`Promise`\<\{ `baseFeePerGas`: `bigint` \| `null`; `blobGasUsed`: `bigint`; `difficulty`: `bigint`; `excessBlobGas`: `bigint`; `extraData`: `` `0x${string}` ``; `gasLimit`: `bigint`; `gasUsed`: `bigint`; `hash`: `blockTag` *extends* `"pending"` ? `null` : `` `0x${string}` ``; `logsBloom`: `blockTag` *extends* `"pending"` ? `null` : `` `0x${string}` ``; `miner`: `` `0x${string}` ``; `mixHash`: `` `0x${string}` ``; `nonce`: `blockTag` *extends* `"pending"` ? `null` : `` `0x${string}` ``; `number`: `blockTag` *extends* `"pending"` ? `null` : `bigint`; `parentBeaconBlockRoot?`: `` `0x${string}` ``; `parentHash`: `` `0x${string}` ``; `receiptsRoot`: `` `0x${string}` ``; `sealFields`: `` `0x${string}` ``[]; `sha3Uncles`: `` `0x${string}` ``; `size`: `bigint`; `stateRoot`: `` `0x${string}` ``; `timestamp`: `bigint`; `totalDifficulty`: `bigint` \| `null`; `transactions`: `includeTransactions` *extends* `true` ? (\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId?`: ... \| ...; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"legacy"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity?`: `undefined`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip2930"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip1559"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes`: readonly ...[]; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip4844"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: `undefined`; `blockHash`: ... *extends* ... ? ... : ...; `blockNumber`: ... *extends* ... ? ... : ...; `blockTimestamp?`: ... \| ...; `chainId`: `number`; `from`: `` `0x${(...)}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${(...)}` ``; `input`: `` `0x${(...)}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${(...)}` ``; `s`: `` `0x${(...)}` ``; `to`: ... \| ...; `transactionIndex`: ... *extends* ... ? ... : ...; `type`: `"eip7702"`; `typeHex`: ... \| ...; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \})[] : `` `0x${string}` ``[]; `transactionsRoot`: `` `0x${string}` ``; `uncles`: `` `0x${string}` ``[]; `withdrawals?`: `Withdrawal`[]; `withdrawalsRoot?`: `` `0x${string}` ``; \}\>

Information about the block. GetBlockReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const block = await client.getBlock()
```

##### getBlockNumber

> **getBlockNumber**: (`args?`) => `Promise`\<`bigint`\>

Returns the number of the most recent block seen.

- Docs: https://viem.sh/docs/actions/public/getBlockNumber
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_fetching-blocks
- JSON-RPC Methods: [`eth_blockNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blocknumber)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args?` | `GetBlockNumberParameters` | GetBlockNumberParameters |

###### Returns

`Promise`\<`bigint`\>

The number of the block. GetBlockNumberReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const blockNumber = await client.getBlockNumber()
// 69420n
```

##### getBlockTransactionCount

> **getBlockTransactionCount**: (`args?`) => `Promise`\<`number`\>

Returns the number of Transactions at a block number, hash, or tag.

- Docs: https://viem.sh/docs/actions/public/getBlockTransactionCount
- JSON-RPC Methods:
  - Calls [`eth_getBlockTransactionCountByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblocktransactioncountbynumber) for `blockNumber` & `blockTag`.
  - Calls [`eth_getBlockTransactionCountByHash`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblocktransactioncountbyhash) for `blockHash`.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args?` | `GetBlockTransactionCountParameters` | GetBlockTransactionCountParameters |

###### Returns

`Promise`\<`number`\>

The block transaction count. GetBlockTransactionCountReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const count = await client.getBlockTransactionCount()
```

##### ~~getBytecode~~

> **getBytecode**: (`args`) => `Promise`\<`GetCodeReturnType`\>

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `GetCodeParameters` |

###### Returns

`Promise`\<`GetCodeReturnType`\>

###### Deprecated

Use `getCode` instead.

##### getCallsStatus

> **getCallsStatus**: (`parameters`) => `Promise`\<\{ `atomic`: `boolean`; `capabilities?`: \{\[`key`: `string`\]: `any`; \} \| \{\[`key`: `string`\]: `any`; \}; `chainId`: `number`; `id`: `string`; `receipts?`: `WalletCallReceipt`\<`bigint`, `"success"` \| `"reverted"`\>[]; `status`: `"pending"` \| `"success"` \| `"failure"` \| `undefined`; `statusCode`: `number`; `version`: `string`; \}\>

Returns the status of a call batch that was sent via `sendCalls`.

- Docs: https://viem.sh/docs/actions/wallet/getCallsStatus
- JSON-RPC Methods: [`wallet_getCallsStatus`](https://eips.ethereum.org/EIPS/eip-5792)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `GetCallsStatusParameters` |

###### Returns

`Promise`\<\{ `atomic`: `boolean`; `capabilities?`: \{\[`key`: `string`\]: `any`; \} \| \{\[`key`: `string`\]: `any`; \}; `chainId`: `number`; `id`: `string`; `receipts?`: `WalletCallReceipt`\<`bigint`, `"success"` \| `"reverted"`\>[]; `status`: `"pending"` \| `"success"` \| `"failure"` \| `undefined`; `statusCode`: `number`; `version`: `string`; \}\>

Status of the calls. GetCallsStatusReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const { receipts, status } = await client.getCallsStatus({ id: '0xdeadbeef' })
```

##### getCapabilities

> **getCapabilities**: \<`chainId`\>(`parameters?`) => `Promise`\<\{ \[K in string \| number \| symbol\]: (chainId extends number ? \{ atomic?: \{ status: ... \}; paymasterService?: \{ supported: ... \}; unstable\_addSubAccount?: \{ keyTypes: ...; supported: ... \}; \[key: string\]: any \} : ChainIdToCapabilities\<Capabilities\<\{ atomic?: ...; paymasterService?: ...; unstable\_addSubAccount?: ...; \[key: ...\]: ... \}\>, number\>)\[K\] \}\>

Extract capabilities that a connected wallet supports (e.g. paymasters, session keys, etc).

- Docs: https://viem.sh/docs/actions/wallet/getCapabilities
- JSON-RPC Methods: [`wallet_getCapabilities`](https://eips.ethereum.org/EIPS/eip-5792)

###### Type Parameters

| Type Parameter |
| ------ |
| `chainId` *extends* `number` \| `undefined` |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters?` | `GetCapabilitiesParameters`\<`chainId`\> |

###### Returns

`Promise`\<\{ \[K in string \| number \| symbol\]: (chainId extends number ? \{ atomic?: \{ status: ... \}; paymasterService?: \{ supported: ... \}; unstable\_addSubAccount?: \{ keyTypes: ...; supported: ... \}; \[key: string\]: any \} : ChainIdToCapabilities\<Capabilities\<\{ atomic?: ...; paymasterService?: ...; unstable\_addSubAccount?: ...; \[key: ...\]: ... \}\>, number\>)\[K\] \}\>

The wallet's capabilities. GetCapabilitiesReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const capabilities = await client.getCapabilities({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### getChainId

> **getChainId**: () => `Promise`\<`number`\> & () => `Promise`\<`number`\>

Returns the chain ID associated with the current network.

- Docs: https://viem.sh/docs/actions/public/getChainId
- JSON-RPC Methods: [`eth_chainId`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_chainid)

###### Returns

The current chain ID. GetChainIdReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const chainId = await client.getChainId()
// 1
```

##### getCode

> **getCode**: (`args`) => `Promise`\<`GetCodeReturnType`\>

Retrieves the bytecode at an address.

- Docs: https://viem.sh/docs/contract/getCode
- JSON-RPC Methods: [`eth_getCode`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getcode)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetCodeParameters` | GetBytecodeParameters |

###### Returns

`Promise`\<`GetCodeReturnType`\>

The contract's bytecode. GetBytecodeReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const code = await client.getCode({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
})
```

##### getContractEvents

> **getContractEvents**: \<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>(`args`) => `Promise`\<`GetContractEventsReturnType`\<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>\>

Returns a list of event logs emitted by a contract.

- Docs: https://viem.sh/docs/actions/public/getContractEvents
- JSON-RPC Methods: [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] | - |
| `eventName` *extends* `string` \| `undefined` | `undefined` |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `fromBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `toBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `GetContractEventsParameters`\<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\> |

###### Returns

`Promise`\<`GetContractEventsReturnType`\<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>\>

A list of event logs. GetContractEventsReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { wagmiAbi } from './abi'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const logs = await client.getContractEvents(client, {
 address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
 abi: wagmiAbi,
 eventName: 'Transfer'
})
```

##### getDelegation

> **getDelegation**: (`args`) => `Promise`\<`GetDelegationReturnType`\>

Returns the address that an account has delegated to via EIP-7702.

- Docs: https://viem.sh/docs/actions/public/getDelegation

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetDelegationParameters` | GetDelegationParameters |

###### Returns

`Promise`\<`GetDelegationReturnType`\>

The delegated address, or undefined if not delegated. GetDelegationReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const delegation = await client.getDelegation({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### getEip712Domain

> **getEip712Domain**: (`args`) => `Promise`\<`GetEip712DomainReturnType`\>

Reads the EIP-712 domain from a contract, based on the ERC-5267 specification.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `GetEip712DomainParameters` |

###### Returns

`Promise`\<`GetEip712DomainReturnType`\>

The EIP-712 domain, fields, and extensions. GetEip712DomainReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const domain = await client.getEip712Domain({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
})
// {
//   domain: {
//     name: 'ExampleContract',
//     version: '1',
//     chainId: 1,
//     verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
//   },
//   fields: '0x0f',
//   extensions: [],
// }
```

##### getEnsAddress

> **getEnsAddress**: (`args`) => `Promise`\<`GetEnsAddressReturnType`\>

Gets address for ENS name.

- Docs: https://viem.sh/docs/ens/actions/getEnsAddress
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `coinType?`: `bigint`; `gatewayUrls?`: `string`[]; `name`: `string`; `strict?`: `boolean`; `universalResolverAddress?`: `` `0x${string}` ``; \} | GetEnsAddressParameters |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.coinType?` | `bigint` | ENSIP-9 compliant coinType (chain) to get ENS address for. To get the `coinType` for a chain id, use the `toCoinType` function: `import { toCoinType } from 'viem' import { base } from 'viem/chains' const coinType = toCoinType(base.id)` **Default** `60n` |
| `args.gatewayUrls?` | `string`[] | Universal Resolver gateway URLs to use for resolving CCIP-read requests. |
| `args.name` | `string` | Name to get the address for. |
| `args.strict?` | `boolean` | Whether or not to throw errors propagated from the ENS Universal Resolver Contract. |
| `args.universalResolverAddress?` | `` `0x${string}` `` | Address of ENS Universal Resolver Contract. |

###### Returns

`Promise`\<`GetEnsAddressReturnType`\>

Address for ENS name or `null` if not found. GetEnsAddressReturnType

###### Remarks

Calls `resolve(bytes, bytes)` on ENS Universal Resolver Contract.

Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const ensAddress = await client.getEnsAddress({
  name: normalize('wevm.eth'),
})
// '0xd2135CfB216b74109775236E36d4b433F1DF507B'
```

##### getEnsAvatar

> **getEnsAvatar**: (`args`) => `Promise`\<`GetEnsAvatarReturnType`\>

Gets the avatar of an ENS name.

- Docs: https://viem.sh/docs/ens/actions/getEnsAvatar
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `assetGatewayUrls?`: `AssetGatewayUrls`; `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `gatewayUrls?`: `string`[]; `name`: `string`; `strict?`: `boolean`; `universalResolverAddress?`: `` `0x${string}` ``; \} | GetEnsAvatarParameters |
| `args.assetGatewayUrls?` | `AssetGatewayUrls` | Gateway urls to resolve IPFS and/or Arweave assets. |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.gatewayUrls?` | `string`[] | Universal Resolver gateway URLs to use for resolving CCIP-read requests. |
| `args.name` | `string` | ENS name to get Text for. |
| `args.strict?` | `boolean` | Whether or not to throw errors propagated from the ENS Universal Resolver Contract. |
| `args.universalResolverAddress?` | `` `0x${string}` `` | Address of ENS Universal Resolver Contract. |

###### Returns

`Promise`\<`GetEnsAvatarReturnType`\>

Avatar URI or `null` if not found. GetEnsAvatarReturnType

###### Remarks

Calls [`getEnsText`](https://viem.sh/docs/ens/actions/getEnsText) with `key` set to `'avatar'`.

Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const ensAvatar = await client.getEnsAvatar({
  name: normalize('wevm.eth'),
})
// 'https://ipfs.io/ipfs/Qma8mnp6xV3J2cRNf3mTth5C8nV11CAnceVinc3y8jSbio'
```

##### getEnsName

> **getEnsName**: (`args`) => `Promise`\<`GetEnsNameReturnType`\>

Gets primary name for specified address.

- Docs: https://viem.sh/docs/ens/actions/getEnsName
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `address`: `` `0x${string}` ``; `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `coinType?`: `bigint`; `gatewayUrls?`: `string`[]; `strict?`: `boolean`; `universalResolverAddress?`: `` `0x${string}` ``; \} | GetEnsNameParameters |
| `args.address` | `` `0x${string}` `` | Address to get ENS name for. |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.coinType?` | `bigint` | ENSIP-9 compliant coinType (chain) to get ENS name for. To get the `coinType` for a chain id, use the `toCoinType` function: `import { toCoinType } from 'viem' import { base } from 'viem/chains' const coinType = toCoinType(base.id)` **Default** `60n` |
| `args.gatewayUrls?` | `string`[] | Universal Resolver gateway URLs to use for resolving CCIP-read requests. |
| `args.strict?` | `boolean` | Whether or not to throw errors propagated from the ENS Universal Resolver Contract. |
| `args.universalResolverAddress?` | `` `0x${string}` `` | Address of ENS Universal Resolver Contract. |

###### Returns

`Promise`\<`GetEnsNameReturnType`\>

Name or `null` if not found. GetEnsNameReturnType

###### Remarks

Calls `reverse(bytes)` on ENS Universal Resolver Contract to "reverse resolve" the address to the primary ENS name.

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const ensName = await client.getEnsName({
  address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
})
// 'wevm.eth'
```

##### getEnsResolver

> **getEnsResolver**: (`args`) => `Promise`\<`` `0x${string}` ``\>

Gets resolver for ENS name.

- Docs: https://viem.sh/docs/ens/actions/getEnsResolver
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `name`: `string`; `universalResolverAddress?`: `` `0x${string}` ``; \} | GetEnsResolverParameters |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.name` | `string` | Name to get the address for. |
| `args.universalResolverAddress?` | `` `0x${string}` `` | Address of ENS Universal Resolver Contract. |

###### Returns

`Promise`\<`` `0x${string}` ``\>

Address for ENS resolver. GetEnsResolverReturnType

###### Remarks

Calls `findResolver(bytes)` on ENS Universal Resolver Contract to retrieve the resolver of an ENS name.

Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const resolverAddress = await client.getEnsResolver({
  name: normalize('wevm.eth'),
})
// '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
```

##### getEnsText

> **getEnsText**: (`args`) => `Promise`\<`GetEnsTextReturnType`\>

Gets a text record for specified ENS name.

- Docs: https://viem.sh/docs/ens/actions/getEnsResolver
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `gatewayUrls?`: `string`[]; `key`: `string`; `name`: `string`; `strict?`: `boolean`; `universalResolverAddress?`: `` `0x${string}` ``; \} | GetEnsTextParameters |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.gatewayUrls?` | `string`[] | Universal Resolver gateway URLs to use for resolving CCIP-read requests. |
| `args.key` | `string` | Text record to retrieve. |
| `args.name` | `string` | ENS name to get Text for. |
| `args.strict?` | `boolean` | Whether or not to throw errors propagated from the ENS Universal Resolver Contract. |
| `args.universalResolverAddress?` | `` `0x${string}` `` | Address of ENS Universal Resolver Contract. |

###### Returns

`Promise`\<`GetEnsTextReturnType`\>

Address for ENS resolver. GetEnsTextReturnType

###### Remarks

Calls `resolve(bytes, bytes)` on ENS Universal Resolver Contract.

Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const twitterRecord = await client.getEnsText({
  name: normalize('wevm.eth'),
  key: 'com.twitter',
})
// 'wevm_dev'
```

##### getFeeHistory

> **getFeeHistory**: (`args`) => `Promise`\<`GetFeeHistoryReturnType`\>

Returns a collection of historical gas information.

- Docs: https://viem.sh/docs/actions/public/getFeeHistory
- JSON-RPC Methods: [`eth_feeHistory`](https://docs.alchemy.com/reference/eth-feehistory)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetFeeHistoryParameters` | GetFeeHistoryParameters |

###### Returns

`Promise`\<`GetFeeHistoryReturnType`\>

The gas estimate (in wei). GetFeeHistoryReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const feeHistory = await client.getFeeHistory({
  blockCount: 4,
  rewardPercentiles: [25, 75],
})
```

##### getFilterChanges

> **getFilterChanges**: \<`filterType`, `abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>(`args`) => `Promise`\<`GetFilterChangesReturnType`\<`filterType`, `abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>\>

Returns a list of logs or hashes based on a [Filter](/docs/glossary/terms#filter) since the last time it was called.

- Docs: https://viem.sh/docs/actions/public/getFilterChanges
- JSON-RPC Methods: [`eth_getFilterChanges`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterchanges)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `filterType` *extends* `FilterType` | - |
| `abi` *extends* `Abi` \| readonly `unknown`[] \| `undefined` | - |
| `eventName` *extends* `string` \| `undefined` | - |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `fromBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `toBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetFilterChangesParameters`\<`filterType`, `abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\> | GetFilterChangesParameters |

###### Returns

`Promise`\<`GetFilterChangesReturnType`\<`filterType`, `abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>\>

Logs or hashes. GetFilterChangesReturnType

###### Remarks

A Filter can be created from the following actions:

- [`createBlockFilter`](https://viem.sh/docs/actions/public/createBlockFilter)
- [`createContractEventFilter`](https://viem.sh/docs/contract/createContractEventFilter)
- [`createEventFilter`](https://viem.sh/docs/actions/public/createEventFilter)
- [`createPendingTransactionFilter`](https://viem.sh/docs/actions/public/createPendingTransactionFilter)

Depending on the type of filter, the return value will be different:

- If the filter was created with `createContractEventFilter` or `createEventFilter`, it returns a list of logs.
- If the filter was created with `createPendingTransactionFilter`, it returns a list of transaction hashes.
- If the filter was created with `createBlockFilter`, it returns a list of block hashes.

###### Examples

```ts
// Blocks
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createBlockFilter()
const hashes = await client.getFilterChanges({ filter })
```

```ts
// Contract Events
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createContractEventFilter({
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  abi: parseAbi(['event Transfer(address indexed, address indexed, uint256)']),
  eventName: 'Transfer',
})
const logs = await client.getFilterChanges({ filter })
```

```ts
// Raw Events
import { createPublicClient, http, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createEventFilter({
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  event: parseAbiItem('event Transfer(address indexed, address indexed, uint256)'),
})
const logs = await client.getFilterChanges({ filter })
```

```ts
// Transactions
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createPendingTransactionFilter()
const hashes = await client.getFilterChanges({ filter })
```

##### getFilterLogs

> **getFilterLogs**: \<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>(`args`) => `Promise`\<`GetFilterLogsReturnType`\<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>\>

Returns a list of event logs since the filter was created.

- Docs: https://viem.sh/docs/actions/public/getFilterLogs
- JSON-RPC Methods: [`eth_getFilterLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterlogs)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] \| `undefined` | - |
| `eventName` *extends* `string` \| `undefined` | - |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `fromBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `toBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetFilterLogsParameters`\<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\> | GetFilterLogsParameters |

###### Returns

`Promise`\<`GetFilterLogsReturnType`\<`abi`, `eventName`, `strict`, `fromBlock`, `toBlock`\>\>

A list of event logs. GetFilterLogsReturnType

###### Remarks

`getFilterLogs` is only compatible with **event filters**.

###### Example

```ts
import { createPublicClient, http, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const filter = await client.createEventFilter({
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  event: parseAbiItem('event Transfer(address indexed, address indexed, uint256)'),
})
const logs = await client.getFilterLogs({ filter })
```

##### getGasPrice

> **getGasPrice**: () => `Promise`\<`bigint`\>

Returns the current price of gas (in wei).

- Docs: https://viem.sh/docs/actions/public/getGasPrice
- JSON-RPC Methods: [`eth_gasPrice`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gasprice)

###### Returns

`Promise`\<`bigint`\>

The gas price (in wei). GetGasPriceReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const gasPrice = await client.getGasPrice()
```

##### getLogs

> **getLogs**: \<`abiEvent`, `abiEvents`, `strict`, `fromBlock`, `toBlock`\>(`args?`) => `Promise`\<`GetLogsReturnType`\<`abiEvent`, `abiEvents`, `strict`, `fromBlock`, `toBlock`\>\>

Returns a list of event logs matching the provided parameters.

- Docs: https://viem.sh/docs/actions/public/getLogs
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/logs_event-logs
- JSON-RPC Methods: [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abiEvent` *extends* `AbiEvent` \| `undefined` | `undefined` |
| `abiEvents` *extends* readonly `unknown`[] \| readonly `AbiEvent`[] \| `undefined` | `abiEvent` *extends* `AbiEvent` ? \[`abiEvent`\] : `undefined` |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |
| `fromBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |
| `toBlock` *extends* `bigint` \| `BlockTag` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args?` | `GetLogsParameters`\<`abiEvent`, `abiEvents`, `strict`, `fromBlock`, `toBlock`\> | GetLogsParameters |

###### Returns

`Promise`\<`GetLogsReturnType`\<`abiEvent`, `abiEvents`, `strict`, `fromBlock`, `toBlock`\>\>

A list of event logs. GetLogsReturnType

###### Example

```ts
import { createPublicClient, http, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const logs = await client.getLogs()
```

##### getPermissions

> **getPermissions**: () => `Promise`\<`GetPermissionsReturnType`\>

Gets the wallets current permissions.

- Docs: https://viem.sh/docs/actions/wallet/getPermissions
- JSON-RPC Methods: [`wallet_getPermissions`](https://eips.ethereum.org/EIPS/eip-2255)

###### Returns

`Promise`\<`GetPermissionsReturnType`\>

The wallet permissions. GetPermissionsReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const permissions = await client.getPermissions()
```

##### getProof

> **getProof**: (`args`) => `Promise`\<`GetProofReturnType`\>

Returns the account and storage values of the specified account including the Merkle-proof.

- Docs: https://viem.sh/docs/actions/public/getProof
- JSON-RPC Methods:
  - Calls [`eth_getProof`](https://eips.ethereum.org/EIPS/eip-1186)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `GetProofParameters` |

###### Returns

`Promise`\<`GetProofReturnType`\>

Proof data. GetProofReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const block = await client.getProof({
 address: '0x...',
 storageKeys: ['0x...'],
})
```

##### getStorageAt

> **getStorageAt**: (`args`) => `Promise`\<`GetStorageAtReturnType`\>

Returns the value from a storage slot at a given address.

- Docs: https://viem.sh/docs/contract/getStorageAt
- JSON-RPC Methods: [`eth_getStorageAt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getstorageat)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetStorageAtParameters` | GetStorageAtParameters |

###### Returns

`Promise`\<`GetStorageAtReturnType`\>

The value of the storage slot. GetStorageAtReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { getStorageAt } from 'viem/contract'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const code = await client.getStorageAt({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  slot: toHex(0),
})
```

##### getTransaction

> **getTransaction**: \<`blockTag`\>(`args`) => `Promise`\<\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"legacy"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: `undefined`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip2930"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip1559"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes`: readonly `` `0x${string}` ``[]; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip4844"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip7702"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \}\>

Returns information about a [Transaction](https://viem.sh/docs/glossary/terms#transaction) given a hash or block identifier.

- Docs: https://viem.sh/docs/actions/public/getTransaction
- Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_fetching-transactions
- JSON-RPC Methods: [`eth_getTransactionByHash`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionByHash)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `blockTag` *extends* `BlockTag` | `"latest"` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetTransactionParameters`\<`blockTag`\> | GetTransactionParameters |

###### Returns

`Promise`\<\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId?`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"legacy"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity?`: `undefined`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice`: `bigint`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip2930"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip1559"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList?`: `undefined`; `blobVersionedHashes`: readonly `` `0x${string}` ``[]; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas`: `bigint`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip4844"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \} \| \{ `accessList`: `AccessList`; `authorizationList`: `SignedAuthorizationList`; `blobVersionedHashes?`: `undefined`; `blockHash`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `` `0x${string}` ``; `blockNumber`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `bigint`; `blockTimestamp?`: `bigint`; `chainId`: `number`; `from`: `` `0x${string}` ``; `gas`: `bigint`; `gasPrice?`: `undefined`; `hash`: `` `0x${string}` ``; `input`: `` `0x${string}` ``; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas`: `bigint`; `maxPriorityFeePerGas`: `bigint`; `nonce`: `number`; `r`: `` `0x${string}` ``; `s`: `` `0x${string}` ``; `to`: `` `0x${string}` `` \| `null`; `transactionIndex`: `blockTag` *extends* `"pending"` ? `true` : `false` *extends* `true` ? `null` : `number`; `type`: `"eip7702"`; `typeHex`: `` `0x${string}` `` \| `null`; `v`: `bigint`; `value`: `bigint`; `yParity`: `number`; \}\>

The transaction information. GetTransactionReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const transaction = await client.getTransaction({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
})
```

##### getTransactionConfirmations

> **getTransactionConfirmations**: (`args`) => `Promise`\<`bigint`\>

Returns the number of blocks passed (confirmations) since the transaction was processed on a block.

- Docs: https://viem.sh/docs/actions/public/getTransactionConfirmations
- Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_fetching-transactions
- JSON-RPC Methods: [`eth_getTransactionConfirmations`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionConfirmations)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetTransactionConfirmationsParameters`\<`Chain` \| `undefined`\> | GetTransactionConfirmationsParameters |

###### Returns

`Promise`\<`bigint`\>

The number of blocks passed since the transaction was processed. If confirmations is 0, then the Transaction has not been confirmed & processed yet. GetTransactionConfirmationsReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const confirmations = await client.getTransactionConfirmations({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
})
```

##### getTransactionCount

> **getTransactionCount**: (`args`) => `Promise`\<`number`\>

Returns the number of [Transactions](https://viem.sh/docs/glossary/terms#transaction) an Account has broadcast / sent.

- Docs: https://viem.sh/docs/actions/public/getTransactionCount
- JSON-RPC Methods: [`eth_getTransactionCount`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactioncount)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetTransactionCountParameters` | GetTransactionCountParameters |

###### Returns

`Promise`\<`number`\>

The number of transactions an account has sent. GetTransactionCountReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const transactionCount = await client.getTransactionCount({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### getTransactionReceipt

> **getTransactionReceipt**: (`args`) => `Promise`\<`TransactionReceipt`\>

Returns the [Transaction Receipt](https://viem.sh/docs/glossary/terms#transaction-receipt) given a [Transaction](https://viem.sh/docs/glossary/terms#transaction) hash.

- Docs: https://viem.sh/docs/actions/public/getTransactionReceipt
- Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_fetching-transactions
- JSON-RPC Methods: [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionReceipt)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `GetTransactionReceiptParameters` | GetTransactionReceiptParameters |

###### Returns

`Promise`\<`TransactionReceipt`\>

The transaction receipt. GetTransactionReceiptReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const transactionReceipt = await client.getTransactionReceipt({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
})
```

##### getTxpoolContent

> **getTxpoolContent**: () => `Promise`\<`GetTxpoolContentReturnType`\>

Returns the details of all transactions currently pending for inclusion in the next block(s), as well as the ones that are being scheduled for future execution only.

- Docs: https://viem.sh/docs/actions/test/getTxpoolContent

###### Returns

`Promise`\<`GetTxpoolContentReturnType`\>

Transaction pool content. GetTxpoolContentReturnType

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
const content = await client.getTxpoolContent()
```

##### getTxpoolStatus

> **getTxpoolStatus**: () => `Promise`\<`GetTxpoolStatusReturnType`\>

Returns a summary of all the transactions currently pending for inclusion in the next block(s), as well as the ones that are being scheduled for future execution only.

- Docs: https://viem.sh/docs/actions/test/getTxpoolStatus

###### Returns

`Promise`\<`GetTxpoolStatusReturnType`\>

Transaction pool status. GetTxpoolStatusReturnType

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
const status = await client.getTxpoolStatus()
```

##### impersonateAccount

> **impersonateAccount**: (`args`) => `Promise`\<`void`\>

Impersonate an account or contract address. This lets you send transactions from that account even if you don't have access to its private key.

- Docs: https://viem.sh/docs/actions/test/impersonateAccount

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `ImpersonateAccountParameters` | ImpersonateAccountParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.impersonateAccount({
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### increaseTime

> **increaseTime**: (`args`) => `Promise`\<`` `0x${string}` ``\>

Jump forward in time by the given amount of time, in seconds.

- Docs: https://viem.sh/docs/actions/test/increaseTime

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `IncreaseTimeParameters` | – IncreaseTimeParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.increaseTime({
  seconds: 420,
})
```

##### inspectTxpool

> **inspectTxpool**: () => `Promise`\<`InspectTxpoolReturnType`\>

Returns a summary of all the transactions currently pending for inclusion in the next block(s), as well as the ones that are being scheduled for future execution only.

- Docs: https://viem.sh/docs/actions/test/inspectTxpool

###### Returns

`Promise`\<`InspectTxpoolReturnType`\>

Transaction pool inspection data. InspectTxpoolReturnType

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
const data = await client.inspectTxpool()
```

##### key

> **key**: `string`

A key for the client.

##### loadState

> **loadState**: (`args`) => `Promise`\<`void`\>

Adds state previously dumped with `dumpState` to the current chain.

- Docs: https://viem.sh/docs/actions/test/loadState

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `LoadStateParameters` |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.loadState({ state: '0x...' })
```

##### mine

> **mine**: (`args`) => `Promise`\<`void`\>

Mine a specified number of blocks.

- Docs: https://viem.sh/docs/actions/test/mine

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `MineParameters` | – MineParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.mine({ blocks: 1 })
```

##### multicall

> **multicall**: \<`contracts`, `allowFailure`\>(`args`) => `Promise`\<`MulticallReturnType`\<`contracts`, `allowFailure`\>\>

Similar to [`readContract`](https://viem.sh/docs/contract/readContract), but batches up multiple functions on a contract in a single RPC call via the [`multicall3` contract](https://github.com/mds1/multicall).

- Docs: https://viem.sh/docs/contract/multicall

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `contracts` *extends* readonly `unknown`[] | - |
| `allowFailure` *extends* `boolean` | `true` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `MulticallParameters`\<`contracts`, `allowFailure`\> | MulticallParameters |

###### Returns

`Promise`\<`MulticallReturnType`\<`contracts`, `allowFailure`\>\>

An array of results with accompanying status. MulticallReturnType

###### Example

```ts
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
])
const result = await client.multicall({
  contracts: [
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi,
      functionName: 'balanceOf',
      args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
    },
    {
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi,
      functionName: 'totalSupply',
    },
  ],
})
// [{ result: 424122n, status: 'success' }, { result: 1000000n, status: 'success' }]
```

##### name

> **name**: `string`

A name for the client.

##### pollingInterval

> **pollingInterval**: `number`

Frequency (in ms) for polling enabled actions & events. Defaults to 4_000 milliseconds.

##### prepareAuthorization

> **prepareAuthorization**: (`parameters`) => `Promise`\<`PrepareAuthorizationReturnType`\>

Prepares an [EIP-7702 Authorization](https://eips.ethereum.org/EIPS/eip-7702) object for signing.
This Action will fill the required fields of the Authorization object if they are not provided (e.g. `nonce` and `chainId`).

With the prepared Authorization object, you can use [`signAuthorization`](https://viem.sh/docs/eip7702/signAuthorization) to sign over the Authorization object.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parameters` | `PrepareAuthorizationParameters`\<`Account` \| `undefined`\> | PrepareAuthorizationParameters |

###### Returns

`Promise`\<`PrepareAuthorizationReturnType`\>

The prepared Authorization object. PrepareAuthorizationReturnType

###### Examples

```ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: http(),
})

const authorization = await client.prepareAuthorization({
  account: privateKeyToAccount('0x..'),
  contractAddress: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})

const authorization = await client.prepareAuthorization({
  contractAddress: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### prepareTransactionRequest

> **prepareTransactionRequest**: \<`request`, `chainOverride`, `accountOverride`\>(`args`) => `Promise`\<\{ \[K in string \| number \| symbol\]: (UnionRequiredBy\<(...) & (...), ParameterTypeToParameters\<(...)\>\> & (unknown extends (...)\[(...)\] ? \{\} : Pick\<(...), (...)\>) & \{ \_capabilities?: (...) \| (...) \})\[K\] \}\> & \<`request`, `chainOverride`, `accountOverride`\>(`args`) => `Promise`\<\{ \[K in string \| number \| symbol\]: (UnionRequiredBy\<(...) & (...), ParameterTypeToParameters\<(...)\>\> & (unknown extends (...)\[(...)\] ? \{\} : Pick\<(...), (...)\>) & \{ \_capabilities?: (...) \| (...) \})\[K\] \}\>

Prepares a transaction request for signing.

- Docs: https://viem.sh/docs/actions/wallet/prepareTransactionRequest

###### Param

PrepareTransactionRequestParameters

###### Returns

The transaction request. PrepareTransactionRequestReturnType

###### Examples

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const request = await client.prepareTransactionRequest({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: custom(window.ethereum),
})
const request = await client.prepareTransactionRequest({
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})
```

##### readContract

> **readContract**: \<`abi`, `functionName`, `args`\>(`args`) => `Promise`\<`ReadContractReturnType`\<`abi`, `functionName`, `args`\>\>

Calls a read-only function on a contract, and returns the response.

- Docs: https://viem.sh/docs/contract/readContract
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts_reading-contracts

###### Type Parameters

| Type Parameter |
| ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] |
| `functionName` *extends* `string` |
| `args` *extends* `unknown` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `ReadContractParameters`\<`abi`, `functionName`, `args`\> | ReadContractParameters |

###### Returns

`Promise`\<`ReadContractReturnType`\<`abi`, `functionName`, `args`\>\>

The response from the contract. Type is inferred. ReadContractReturnType

###### Remarks

A "read-only" function (constant function) on a Solidity contract is denoted by a `view` or `pure` keyword. They can only read the state of the contract, and cannot make any changes to it. Since read-only methods do not change the state of the contract, they do not require any gas to be executed, and can be called by any user without the need to pay for gas.

Internally, uses a [Public Client](https://viem.sh/docs/clients/public) to call the [`call` action](https://viem.sh/docs/actions/public/call) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).

###### Example

```ts
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'
import { readContract } from 'viem/contract'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const result = await client.readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
  functionName: 'balanceOf',
  args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
})
// 424122n
```

##### removeBlockTimestampInterval

> **removeBlockTimestampInterval**: () => `Promise`\<`void`\>

Removes [`setBlockTimestampInterval`](https://viem.sh/docs/actions/test/setBlockTimestampInterval) if it exists.

- Docs: https://viem.sh/docs/actions/test/removeBlockTimestampInterval

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'
import { removeBlockTimestampInterval } from 'viem/test'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.removeBlockTimestampInterval()
```

##### request

> **request**: `EIP1193RequestFn`\<\[\{ `Method`: `"web3_clientVersion"`; `Parameters?`: `undefined`; `ReturnType`: `string`; \}, \{ `Method`: `"web3_sha3"`; `Parameters`: \[`` `0x${string}` ``\]; `ReturnType`: `string`; \}, \{ `Method`: `"net_listening"`; `Parameters?`: `undefined`; `ReturnType`: `boolean`; \}, \{ `Method`: `"net_peerCount"`; `Parameters?`: `undefined`; `ReturnType`: `` `0x${string}` ``; \}, \{ `Method`: `"net_version"`; `Parameters?`: `undefined`; `ReturnType`: `` `0x${string}` ``; \}\]\>

Request function wrapped with friendly error handling

##### requestAddresses

> **requestAddresses**: () => `Promise`\<`RequestAddressesReturnType`\>

Requests a list of accounts managed by a wallet.

- Docs: https://viem.sh/docs/actions/wallet/requestAddresses
- JSON-RPC Methods: [`eth_requestAccounts`](https://eips.ethereum.org/EIPS/eip-1102)

Sends a request to the wallet, asking for permission to access the user's accounts. After the user accepts the request, it will return a list of accounts (addresses).

This API can be useful for dapps that need to access the user's accounts in order to execute transactions or interact with smart contracts.

###### Returns

`Promise`\<`RequestAddressesReturnType`\>

List of accounts managed by a wallet RequestAddressesReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const accounts = await client.requestAddresses()
```

##### requestPermissions

> **requestPermissions**: (`args`) => `Promise`\<`RequestPermissionsReturnType`\>

Requests permissions for a wallet.

- Docs: https://viem.sh/docs/actions/wallet/requestPermissions
- JSON-RPC Methods: [`wallet_requestPermissions`](https://eips.ethereum.org/EIPS/eip-2255)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{\[`key`: `string`\]: `Record`\<`string`, `any`\>; `eth_accounts`: `Record`\<`string`, `any`\>; \} | RequestPermissionsParameters |
| `args.eth_accounts` | `Record`\<`string`, `any`\> | - |

###### Returns

`Promise`\<`RequestPermissionsReturnType`\>

The wallet permissions. RequestPermissionsReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const permissions = await client.requestPermissions({
  eth_accounts: {}
})
```

##### reset

> **reset**: (`args?`) => `Promise`\<`void`\>

Resets fork back to its original state.

- Docs: https://viem.sh/docs/actions/test/reset

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args?` | `ResetParameters` | – ResetParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.reset({ blockNumber: 69420n })
```

##### revert

> **revert**: (`args`) => `Promise`\<`void`\>

Revert the state of the blockchain at the current block.

- Docs: https://viem.sh/docs/actions/test/revert

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `RevertParameters` | – RevertParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.revert({ id: '0x…' })
```

##### sendCalls

> **sendCalls**: \<`calls`, `chainOverride`\>(`parameters`) => `Promise`\<\{ `capabilities?`: \{\[`key`: `string`\]: `any`; \}; `id`: `string`; \}\>

Requests the connected wallet to send a batch of calls.

- Docs: https://viem.sh/docs/actions/wallet/sendCalls
- JSON-RPC Methods: [`wallet_sendCalls`](https://eips.ethereum.org/EIPS/eip-5792)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `calls` *extends* readonly `unknown`[] | - |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `SendCallsParameters`\<`Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `calls`\> |

###### Returns

`Promise`\<\{ `capabilities?`: \{\[`key`: `string`\]: `any`; \}; `id`: `string`; \}\>

Transaction identifier. SendCallsReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const id = await client.sendCalls({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  calls: [
    {
      data: '0xdeadbeef',
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    },
    {
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 69420n,
    },
  ],
})
```

##### sendCallsSync

> **sendCallsSync**: \<`calls`, `chainOverride`\>(`parameters`) => `Promise`\<\{ `atomic`: `boolean`; `capabilities?`: \{\[`key`: `string`\]: `any`; \} \| \{\[`key`: `string`\]: `any`; \}; `chainId`: `number`; `id`: `string`; `receipts?`: `WalletCallReceipt`\<`bigint`, `"success"` \| `"reverted"`\>[]; `status`: `"pending"` \| `"success"` \| `"failure"` \| `undefined`; `statusCode`: `number`; `version`: `string`; \}\>

Requests the connected wallet to send a batch of calls, and waits for the calls to be included in a block.

- Docs: https://viem.sh/docs/actions/wallet/sendCallsSync
- JSON-RPC Methods: [`wallet_sendCalls`](https://eips.ethereum.org/EIPS/eip-5792)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `calls` *extends* readonly `unknown`[] | - |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `SendCallsSyncParameters`\<`Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `calls`\> |

###### Returns

`Promise`\<\{ `atomic`: `boolean`; `capabilities?`: \{\[`key`: `string`\]: `any`; \} \| \{\[`key`: `string`\]: `any`; \}; `chainId`: `number`; `id`: `string`; `receipts?`: `WalletCallReceipt`\<`bigint`, `"success"` \| `"reverted"`\>[]; `status`: `"pending"` \| `"success"` \| `"failure"` \| `undefined`; `statusCode`: `number`; `version`: `string`; \}\>

Calls status. SendCallsSyncReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const status = await client.sendCallsSync({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  calls: [
    {
      data: '0xdeadbeef',
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    },
    {
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 69420n,
    },
  ],
})
```

##### sendRawTransaction

> **sendRawTransaction**: (`args`) => `Promise`\<`` `0x${string}` ``\> & (`args`) => `Promise`\<`` `0x${string}` ``\>

Sends a **signed** transaction to the network

- Docs: https://viem.sh/docs/actions/wallet/sendRawTransaction
- JSON-RPC Method: [`eth_sendRawTransaction`](https://ethereum.github.io/execution-apis/api-documentation/)

###### Param

Client to use

###### Param

SendRawTransactionParameters

###### Returns

The transaction hash. SendRawTransactionReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { sendRawTransaction } from 'viem/wallet'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const hash = await client.sendRawTransaction({
  serializedTransaction: '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33'
})
```

##### sendRawTransactionSync

> **sendRawTransactionSync**: (`args`) => `Promise`\<`TransactionReceipt`\> & (`args`) => `Promise`\<`TransactionReceipt`\>

Sends a **signed** transaction to the network

- Docs: https://viem.sh/docs/actions/wallet/sendRawTransactionSync
- JSON-RPC Method: [`eth_sendRawTransactionSync`](https://eips.ethereum.org/EIPS/eip-7966)

###### Param

Client to use

###### Param

SendRawTransactionSyncParameters

###### Returns

The transaction receipt. SendRawTransactionSyncReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { sendRawTransactionSync } from 'viem/wallet'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const receipt = await client.sendRawTransactionSync({
  serializedTransaction: '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33'
})
```

##### sendTransaction

> **sendTransaction**: \<`request`, `chainOverride`\>(`args`) => `Promise`\<`` `0x${string}` ``\>

Creates, signs, and sends a new transaction to the network.

- Docs: https://viem.sh/docs/actions/wallet/sendTransaction
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_sending-transactions
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
  - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `request` *extends* `Omit`\<\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `bigint`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"legacy"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `bigint`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip2930"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip1559"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly `` `0x${(...)}` ``[] \| readonly `ByteArray`[]; `blobVersionedHashes`: readonly `` `0x${string}` ``[]; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `bigint`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: readonly `BlobSidecar`\<...\>[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"eip4844"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly `` `0x${(...)}` ``[] \| readonly `ByteArray`[]; `blobVersionedHashes?`: readonly `` `0x${(...)}` ``[]; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `bigint`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: readonly `BlobSidecar`\<...\>[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"eip4844"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `AuthorizationList`\<`number`, `boolean`\>; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip7702"`; `value?`: `bigint`; \}, `"from"`\> & `object` | - |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SendTransactionParameters`\<`Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `request`\> | SendTransactionParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

The [Transaction](https://viem.sh/docs/glossary/terms#transaction) hash. SendTransactionReturnType

###### Examples

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const hash = await client.sendTransaction({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const hash = await client.sendTransaction({
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

##### sendTransactionSync

> **sendTransactionSync**: \<`request`, `chainOverride`\>(`args`) => `Promise`\<`TransactionReceipt`\>

Creates, signs, and sends a new transaction to the network synchronously.
Returns the transaction receipt.

- Docs: https://viem.sh/docs/actions/wallet/sendTransactionSync
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_sending-transactions
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
  - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `request` *extends* `Omit`\<\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `bigint`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"legacy"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `bigint`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip2930"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip1559"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly `` `0x${(...)}` ``[] \| readonly `ByteArray`[]; `blobVersionedHashes`: readonly `` `0x${string}` ``[]; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `bigint`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: readonly `BlobSidecar`\<...\>[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"eip4844"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly `` `0x${(...)}` ``[] \| readonly `ByteArray`[]; `blobVersionedHashes?`: readonly `` `0x${(...)}` ``[]; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `bigint`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: readonly `BlobSidecar`\<...\>[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"eip4844"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `AuthorizationList`\<`number`, `boolean`\>; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip7702"`; `value?`: `bigint`; \}, `"from"`\> & `object` | - |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SendTransactionSyncParameters`\<`Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `request`\> | SendTransactionParameters |

###### Returns

`Promise`\<`TransactionReceipt`\>

The transaction receipt. SendTransactionReturnType

###### Examples

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const receipt = await client.sendTransactionSync({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const receipt = await client.sendTransactionSync({
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

##### sendUnsignedTransaction

> **sendUnsignedTransaction**: \<`chain`\>(`args`) => `Promise`\<`` `0x${string}` ``\>

Executes a transaction regardless of the signature.

- Docs: https://viem.sh/docs/actions/test/sendUnsignedTransaction

###### Type Parameters

| Type Parameter |
| ------ |
| `chain` *extends* `Chain` \| `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SendUnsignedTransactionParameters`\<`chain`\> | – SendUnsignedTransactionParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

The transaction hash. SendUnsignedTransactionReturnType

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
const hash = await client.sendUnsignedTransaction({
  from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

##### setAutomine

> **setAutomine**: (`args`) => `Promise`\<`void`\>

Enables or disables the automatic mining of new blocks with each new transaction submitted to the network.

- Docs: https://viem.sh/docs/actions/test/setAutomine

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `boolean` |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setAutomine()
```

##### setBalance

> **setBalance**: (`args`) => `Promise`\<`void`\>

Modifies the balance of an account.

- Docs: https://viem.sh/docs/actions/test/setBalance

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetBalanceParameters` | – SetBalanceParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http, parseEther } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setBalance({
  address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
  value: parseEther('1'),
})
```

##### setBlockGasLimit

> **setBlockGasLimit**: (`args`) => `Promise`\<`void`\>

Sets the block's gas limit.

- Docs: https://viem.sh/docs/actions/test/setBlockGasLimit

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetBlockGasLimitParameters` | – SetBlockGasLimitParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setBlockGasLimit({ gasLimit: 420_000n })
```

##### setBlockTimestampInterval

> **setBlockTimestampInterval**: (`args`) => `Promise`\<`void`\>

Similar to [`increaseTime`](https://viem.sh/docs/actions/test/increaseTime), but sets a block timestamp `interval`. The timestamp of future blocks will be computed as `lastBlock_timestamp` + `interval`.

- Docs: https://viem.sh/docs/actions/test/setBlockTimestampInterval

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetBlockTimestampIntervalParameters` | – SetBlockTimestampIntervalParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setBlockTimestampInterval({ interval: 5 })
```

##### setCode

> **setCode**: (`args`) => `Promise`\<`void`\>

Modifies the bytecode stored at an account's address.

- Docs: https://viem.sh/docs/actions/test/setCode

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetCodeParameters` | – SetCodeParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setCode({
  address: '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79',
  bytecode: '0x60806040526000600355600019600955600c80546001600160a01b031916737a250d5630b4cf539739df…',
})
```

##### setCoinbase

> **setCoinbase**: (`args`) => `Promise`\<`void`\>

Sets the coinbase address to be used in new blocks.

- Docs: https://viem.sh/docs/actions/test/setCoinbase

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetCoinbaseParameters` | – SetCoinbaseParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setCoinbase({
  address: '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79',
})
```

##### setIntervalMining

> **setIntervalMining**: (`args`) => `Promise`\<`void`\>

Sets the automatic mining interval (in seconds) of blocks. Setting the interval to 0 will disable automatic mining.

- Docs: https://viem.sh/docs/actions/test/setIntervalMining

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetIntervalMiningParameters` | – SetIntervalMiningParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setIntervalMining({ interval: 5 })
```

##### setLoggingEnabled

> **setLoggingEnabled**: (`args`) => `Promise`\<`void`\>

Enable or disable logging on the test node network.

- Docs: https://viem.sh/docs/actions/test/setLoggingEnabled

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `boolean` |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setLoggingEnabled()
```

##### setMinGasPrice

> **setMinGasPrice**: (`args`) => `Promise`\<`void`\>

Change the minimum gas price accepted by the network (in wei).

- Docs: https://viem.sh/docs/actions/test/setMinGasPrice

Note: `setMinGasPrice` can only be used on clients that do not have EIP-1559 enabled.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetMinGasPriceParameters` | – SetBlockGasLimitParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http, parseGwei } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setMinGasPrice({
  gasPrice: parseGwei('20'),
})
```

##### setNextBlockBaseFeePerGas

> **setNextBlockBaseFeePerGas**: (`args`) => `Promise`\<`void`\>

Sets the next block's base fee per gas.

- Docs: https://viem.sh/docs/actions/test/setNextBlockBaseFeePerGas

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetNextBlockBaseFeePerGasParameters` | – SetNextBlockBaseFeePerGasParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http, parseGwei } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setNextBlockBaseFeePerGas({
  baseFeePerGas: parseGwei('20'),
})
```

##### setNextBlockTimestamp

> **setNextBlockTimestamp**: (`args`) => `Promise`\<`void`\>

Sets the next block's timestamp.

- Docs: https://viem.sh/docs/actions/test/setNextBlockTimestamp

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetNextBlockTimestampParameters` | – SetNextBlockTimestampParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setNextBlockTimestamp({ timestamp: 1671744314n })
```

##### setNonce

> **setNonce**: (`args`) => `Promise`\<`void`\>

Modifies (overrides) the nonce of an account.

- Docs: https://viem.sh/docs/actions/test/setNonce

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetNonceParameters` | – SetNonceParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setNonce({
  address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
  nonce: 420,
})
```

##### setRpcUrl

> **setRpcUrl**: (`args`) => `Promise`\<`void`\>

Sets the backend RPC URL.

- Docs: https://viem.sh/docs/actions/test/setRpcUrl

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `string` |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setRpcUrl('https://eth-mainnet.g.alchemy.com/v2')
```

##### setStorageAt

> **setStorageAt**: (`args`) => `Promise`\<`void`\>

Writes to a slot of an account's storage.

- Docs: https://viem.sh/docs/actions/test/setStorageAt

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SetStorageAtParameters` | – SetStorageAtParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.setStorageAt({
  address: '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79',
  index: 2,
  value: '0x0000000000000000000000000000000000000000000000000000000000000069',
})
```

##### showCallsStatus

> **showCallsStatus**: (`parameters`) => `Promise`\<`void`\>

Requests for the wallet to show information about a call batch
that was sent via `sendCalls`.

- Docs: https://viem.sh/docs/actions/wallet/showCallsStatus
- JSON-RPC Methods: [`wallet_showCallsStatus`](https://eips.ethereum.org/EIPS/eip-5792)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `ShowCallsStatusParameters` |

###### Returns

`Promise`\<`void`\>

Displays status of the calls in wallet. ShowCallsStatusReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

await client.showCallsStatus({ id: '0xdeadbeef' })
```

##### signAuthorization

> **signAuthorization**: (`parameters`) => `Promise`\<`SignAuthorizationReturnType`\>

Signs an [EIP-7702 Authorization](https://eips.ethereum.org/EIPS/eip-7702) object.

With the calculated signature, you can:
- use [`verifyAuthorization`](https://viem.sh/docs/eip7702/verifyAuthorization) to verify the signed Authorization object,
- use [`recoverAuthorizationAddress`](https://viem.sh/docs/eip7702/recoverAuthorizationAddress) to recover the signing address from the signed Authorization object.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parameters` | `SignAuthorizationParameters`\<`Account` \| `undefined`\> | SignAuthorizationParameters |

###### Returns

`Promise`\<`SignAuthorizationReturnType`\>

The signed Authorization object. SignAuthorizationReturnType

###### Examples

```ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: http(),
})

const signature = await client.signAuthorization({
  account: privateKeyToAccount('0x..'),
  contractAddress: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})

const signature = await client.signAuthorization({
  contractAddress: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### signMessage

> **signMessage**: (`args`) => `Promise`\<`` `0x${string}` ``\>

Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.

- Docs: https://viem.sh/docs/actions/wallet/signMessage
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data#personal-sign)
  - Local Accounts: Signs locally. No JSON-RPC request.

With the calculated signature, you can:
- use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage) to verify the signature,
- use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress) to recover the signing address from a signature.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SignMessageParameters`\<`Account` \| `undefined`\> | SignMessageParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

The signed message. SignMessageReturnType

###### Examples

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await client.signMessage({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  message: 'hello world',
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const signature = await client.signMessage({
  message: 'hello world',
})
```

##### signTransaction

> **signTransaction**: \<`chainOverride`, `request`\>(`args`) => `Promise`\<`TransactionSerialized`\<`GetTransactionType`\<`request`, `request` *extends* `LegacyProperties` ? `"legacy"` : `never` \| `request` *extends* `EIP1559Properties` ? `"eip1559"` : `never` \| `request` *extends* `EIP2930Properties` ? `"eip2930"` : `never` \| `request` *extends* `EIP4844Properties` ? `"eip4844"` : `never` \| `request` *extends* `EIP7702Properties` ? `"eip7702"` : `never` \| `request`\[`"type"`\] *extends* `string` \| `undefined` ? `Extract`\<`any`\[`any`\], `string`\> : `never`\>, `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip1559"` ? `` `0x02${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip2930"` ? `` `0x01${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip4844"` ? `` `0x03${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip7702"` ? `` `0x04${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"legacy"` ? `TransactionSerializedLegacy` : `never`\>\>

Signs a transaction.

- Docs: https://viem.sh/docs/actions/wallet/signTransaction
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_signTransaction`](https://ethereum.github.io/execution-apis/api-documentation/)
  - Local Accounts: Signs locally. No JSON-RPC request.

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `chainOverride` *extends* `Chain` \| `undefined` | - |
| `request` *extends* `Omit`\<\{ `accessList?`: `undefined`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `bigint`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"legacy"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `bigint`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `undefined`; `maxPriorityFeePerGas?`: `undefined`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip2930"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip1559"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs?`: readonly `` `0x${string}` ``[] \| readonly `ByteArray`[]; `blobVersionedHashes`: readonly `` `0x${string}` ``[]; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `bigint`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: readonly `BlobSidecar`\<`` `0x${(...)}` ``\>[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"eip4844"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `undefined`; `blobs`: readonly `` `0x${string}` ``[] \| readonly `ByteArray`[]; `blobVersionedHashes?`: readonly `` `0x${string}` ``[]; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `Kzg`; `maxFeePerBlobGas?`: `bigint`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: readonly `BlobSidecar`\<`` `0x${(...)}` ``\>[]; `to`: `` `0x${string}` `` \| `null`; `type?`: `"eip4844"`; `value?`: `bigint`; \}, `"from"`\> \| `Omit`\<\{ `accessList?`: `AccessList`; `authorizationList?`: `AuthorizationList`\<`number`, `boolean`\>; `blobs?`: `undefined`; `blobVersionedHashes?`: `undefined`; `data?`: `` `0x${string}` ``; `from?`: `` `0x${string}` ``; `gas?`: `bigint`; `gasPrice?`: `undefined`; `kzg?`: `undefined`; `maxFeePerBlobGas?`: `undefined`; `maxFeePerGas?`: `bigint`; `maxPriorityFeePerGas?`: `bigint`; `nonce?`: `number`; `sidecars?`: `undefined`; `to?`: `` `0x${string}` `` \| `null`; `type?`: `"eip7702"`; `value?`: `bigint`; \}, `"from"`\> | `UnionOmit`\<`ExtractChainFormatterParameters`\<`DeriveChain`\<`Chain` \| `undefined`, `chainOverride`\>, `"transactionRequest"`, `TransactionRequest`\>, `"from"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SignTransactionParameters`\<`Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `request`\> | SignTransactionParameters |

###### Returns

`Promise`\<`TransactionSerialized`\<`GetTransactionType`\<`request`, `request` *extends* `LegacyProperties` ? `"legacy"` : `never` \| `request` *extends* `EIP1559Properties` ? `"eip1559"` : `never` \| `request` *extends* `EIP2930Properties` ? `"eip2930"` : `never` \| `request` *extends* `EIP4844Properties` ? `"eip4844"` : `never` \| `request` *extends* `EIP7702Properties` ? `"eip7702"` : `never` \| `request`\[`"type"`\] *extends* `string` \| `undefined` ? `Extract`\<`any`\[`any`\], `string`\> : `never`\>, `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip1559"` ? `` `0x02${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip2930"` ? `` `0x01${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip4844"` ? `` `0x03${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"eip7702"` ? `` `0x04${string}` `` : `never` \| `GetTransactionType`\<`request`, ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ... \| ... *extends* ... ? ... : ...\> *extends* `"legacy"` ? `TransactionSerializedLegacy` : `never`\>\>

The signed message. SignTransactionReturnType

###### Examples

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const request = await client.prepareTransactionRequest({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})
const signature = await client.signTransaction(request)
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: custom(window.ethereum),
})
const request = await client.prepareTransactionRequest({
  to: '0x0000000000000000000000000000000000000000',
  value: 1n,
})
const signature = await client.signTransaction(request)
```

##### signTypedData

> **signTypedData**: \<`typedData`, `primaryType`\>(`args`) => `Promise`\<`` `0x${string}` ``\>

Signs typed data and calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.

- Docs: https://viem.sh/docs/actions/wallet/signTypedData
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data#signtypeddata-v4)
  - Local Accounts: Signs locally. No JSON-RPC request.

###### Type Parameters

| Type Parameter |
| ------ |
| `typedData` *extends* \{\[`key`: `string`\]: readonly `TypedDataParameter`[]; \[`key`: `` `string[${string}]` ``\]: `undefined`; \[`key`: `` `function[${string}]` ``\]: `undefined`; \[`key`: `` `address[${string}]` ``\]: `undefined`; \[`key`: `` `bool[${string}]` ``\]: `undefined`; \[`key`: `` `bytes[${string}]` ``\]: `undefined`; \[`key`: `` `bytes30[${string}]` ``\]: `undefined`; \[`key`: `` `bytes32[${string}]` ``\]: `undefined`; \[`key`: `` `bytes1[${string}]` ``\]: `undefined`; \[`key`: `` `bytes2[${string}]` ``\]: `undefined`; \[`key`: `` `bytes3[${string}]` ``\]: `undefined`; \[`key`: `` `bytes4[${string}]` ``\]: `undefined`; \[`key`: `` `bytes5[${string}]` ``\]: `undefined`; \[`key`: `` `bytes6[${string}]` ``\]: `undefined`; \[`key`: `` `bytes7[${string}]` ``\]: `undefined`; \[`key`: `` `bytes8[${string}]` ``\]: `undefined`; \[`key`: `` `bytes9[${string}]` ``\]: `undefined`; \[`key`: `` `bytes10[${string}]` ``\]: `undefined`; \[`key`: `` `bytes11[${string}]` ``\]: `undefined`; \[`key`: `` `bytes12[${string}]` ``\]: `undefined`; \[`key`: `` `bytes13[${string}]` ``\]: `undefined`; \[`key`: `` `bytes14[${string}]` ``\]: `undefined`; \[`key`: `` `bytes15[${string}]` ``\]: `undefined`; \[`key`: `` `bytes16[${string}]` ``\]: `undefined`; \[`key`: `` `bytes17[${string}]` ``\]: `undefined`; \[`key`: `` `bytes18[${string}]` ``\]: `undefined`; \[`key`: `` `bytes19[${string}]` ``\]: `undefined`; \[`key`: `` `bytes20[${string}]` ``\]: `undefined`; \[`key`: `` `bytes21[${string}]` ``\]: `undefined`; \[`key`: `` `bytes22[${string}]` ``\]: `undefined`; \[`key`: `` `bytes23[${string}]` ``\]: `undefined`; \[`key`: `` `bytes24[${string}]` ``\]: `undefined`; \[`key`: `` `bytes25[${string}]` ``\]: `undefined`; \[`key`: `` `bytes26[${string}]` ``\]: `undefined`; \[`key`: `` `bytes27[${string}]` ``\]: `undefined`; \[`key`: `` `bytes28[${string}]` ``\]: `undefined`; \[`key`: `` `bytes29[${string}]` ``\]: `undefined`; \[`key`: `` `bytes31[${string}]` ``\]: `undefined`; \[`key`: `` `int[${string}]` ``\]: `undefined`; \[`key`: `` `int32[${string}]` ``\]: `undefined`; \[`key`: `` `int8[${string}]` ``\]: `undefined`; \[`key`: `` `int16[${string}]` ``\]: `undefined`; \[`key`: `` `int24[${string}]` ``\]: `undefined`; \[`key`: `` `int40[${string}]` ``\]: `undefined`; \[`key`: `` `int48[${string}]` ``\]: `undefined`; \[`key`: `` `int56[${string}]` ``\]: `undefined`; \[`key`: `` `int64[${string}]` ``\]: `undefined`; \[`key`: `` `int72[${string}]` ``\]: `undefined`; \[`key`: `` `int80[${string}]` ``\]: `undefined`; \[`key`: `` `int88[${string}]` ``\]: `undefined`; \[`key`: `` `int96[${string}]` ``\]: `undefined`; \[`key`: `` `int104[${string}]` ``\]: `undefined`; \[`key`: `` `int112[${string}]` ``\]: `undefined`; \[`key`: `` `int120[${string}]` ``\]: `undefined`; \[`key`: `` `int128[${string}]` ``\]: `undefined`; \[`key`: `` `int136[${string}]` ``\]: `undefined`; \[`key`: `` `int144[${string}]` ``\]: `undefined`; \[`key`: `` `int152[${string}]` ``\]: `undefined`; \[`key`: `` `int160[${string}]` ``\]: `undefined`; \[`key`: `` `int168[${string}]` ``\]: `undefined`; \[`key`: `` `int176[${string}]` ``\]: `undefined`; \[`key`: `` `int184[${string}]` ``\]: `undefined`; \[`key`: `` `int192[${string}]` ``\]: `undefined`; \[`key`: `` `int200[${string}]` ``\]: `undefined`; \[`key`: `` `int208[${string}]` ``\]: `undefined`; \[`key`: `` `int216[${string}]` ``\]: `undefined`; \[`key`: `` `int224[${string}]` ``\]: `undefined`; \[`key`: `` `int232[${string}]` ``\]: `undefined`; \[`key`: `` `int240[${string}]` ``\]: `undefined`; \[`key`: `` `int248[${string}]` ``\]: `undefined`; \[`key`: `` `int256[${string}]` ``\]: `undefined`; \[`key`: `` `uint[${string}]` ``\]: `undefined`; \[`key`: `` `uint32[${string}]` ``\]: `undefined`; \[`key`: `` `uint8[${string}]` ``\]: `undefined`; \[`key`: `` `uint16[${string}]` ``\]: `undefined`; \[`key`: `` `uint24[${string}]` ``\]: `undefined`; \[`key`: `` `uint40[${string}]` ``\]: `undefined`; \[`key`: `` `uint48[${string}]` ``\]: `undefined`; \[`key`: `` `uint56[${string}]` ``\]: `undefined`; \[`key`: `` `uint64[${string}]` ``\]: `undefined`; \[`key`: `` `uint72[${string}]` ``\]: `undefined`; \[`key`: `` `uint80[${string}]` ``\]: `undefined`; \[`key`: `` `uint88[${string}]` ``\]: `undefined`; \[`key`: `` `uint96[${string}]` ``\]: `undefined`; \[`key`: `` `uint104[${string}]` ``\]: `undefined`; \[`key`: `` `uint112[${string}]` ``\]: `undefined`; \[`key`: `` `uint120[${string}]` ``\]: `undefined`; \[`key`: `` `uint128[${string}]` ``\]: `undefined`; \[`key`: `` `uint136[${string}]` ``\]: `undefined`; \[`key`: `` `uint144[${string}]` ``\]: `undefined`; \[`key`: `` `uint152[${string}]` ``\]: `undefined`; \[`key`: `` `uint160[${string}]` ``\]: `undefined`; \[`key`: `` `uint168[${string}]` ``\]: `undefined`; \[`key`: `` `uint176[${string}]` ``\]: `undefined`; \[`key`: `` `uint184[${string}]` ``\]: `undefined`; \[`key`: `` `uint192[${string}]` ``\]: `undefined`; \[`key`: `` `uint200[${string}]` ``\]: `undefined`; \[`key`: `` `uint208[${string}]` ``\]: `undefined`; \[`key`: `` `uint216[${string}]` ``\]: `undefined`; \[`key`: `` `uint224[${string}]` ``\]: `undefined`; \[`key`: `` `uint232[${string}]` ``\]: `undefined`; \[`key`: `` `uint240[${string}]` ``\]: `undefined`; \[`key`: `` `uint248[${string}]` ``\]: `undefined`; \[`key`: `` `uint256[${string}]` ``\]: `undefined`; `address?`: `undefined`; `bool?`: `undefined`; `bytes?`: `undefined`; `bytes1?`: `undefined`; `bytes10?`: `undefined`; `bytes11?`: `undefined`; `bytes12?`: `undefined`; `bytes13?`: `undefined`; `bytes14?`: `undefined`; `bytes15?`: `undefined`; `bytes16?`: `undefined`; `bytes17?`: `undefined`; `bytes18?`: `undefined`; `bytes19?`: `undefined`; `bytes2?`: `undefined`; `bytes20?`: `undefined`; `bytes21?`: `undefined`; `bytes22?`: `undefined`; `bytes23?`: `undefined`; `bytes24?`: `undefined`; `bytes25?`: `undefined`; `bytes26?`: `undefined`; `bytes27?`: `undefined`; `bytes28?`: `undefined`; `bytes29?`: `undefined`; `bytes3?`: `undefined`; `bytes30?`: `undefined`; `bytes31?`: `undefined`; `bytes32?`: `undefined`; `bytes4?`: `undefined`; `bytes5?`: `undefined`; `bytes6?`: `undefined`; `bytes7?`: `undefined`; `bytes8?`: `undefined`; `bytes9?`: `undefined`; `int104?`: `undefined`; `int112?`: `undefined`; `int120?`: `undefined`; `int128?`: `undefined`; `int136?`: `undefined`; `int144?`: `undefined`; `int152?`: `undefined`; `int16?`: `undefined`; `int160?`: `undefined`; `int168?`: `undefined`; `int176?`: `undefined`; `int184?`: `undefined`; `int192?`: `undefined`; `int200?`: `undefined`; `int208?`: `undefined`; `int216?`: `undefined`; `int224?`: `undefined`; `int232?`: `undefined`; `int24?`: `undefined`; `int240?`: `undefined`; `int248?`: `undefined`; `int256?`: `undefined`; `int32?`: `undefined`; `int40?`: `undefined`; `int48?`: `undefined`; `int56?`: `undefined`; `int64?`: `undefined`; `int72?`: `undefined`; `int8?`: `undefined`; `int80?`: `undefined`; `int88?`: `undefined`; `int96?`: `undefined`; `string?`: `undefined`; `uint104?`: `undefined`; `uint112?`: `undefined`; `uint120?`: `undefined`; `uint128?`: `undefined`; `uint136?`: `undefined`; `uint144?`: `undefined`; `uint152?`: `undefined`; `uint16?`: `undefined`; `uint160?`: `undefined`; `uint168?`: `undefined`; `uint176?`: `undefined`; `uint184?`: `undefined`; `uint192?`: `undefined`; `uint200?`: `undefined`; `uint208?`: `undefined`; `uint216?`: `undefined`; `uint224?`: `undefined`; `uint232?`: `undefined`; `uint24?`: `undefined`; `uint240?`: `undefined`; `uint248?`: `undefined`; `uint256?`: `undefined`; `uint32?`: `undefined`; `uint40?`: `undefined`; `uint48?`: `undefined`; `uint56?`: `undefined`; `uint64?`: `undefined`; `uint72?`: `undefined`; `uint8?`: `undefined`; `uint80?`: `undefined`; `uint88?`: `undefined`; `uint96?`: `undefined`; \} \| \{\[`key`: `string`\]: `unknown`; \} |
| `primaryType` *extends* `string` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SignTypedDataParameters`\<`typedData`, `primaryType`, `Account` \| `undefined`\> | SignTypedDataParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

The signed data. SignTypedDataReturnType

###### Examples

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await client.signTypedData({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})
```

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const signature = await client.signTypedData({
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})
```

##### ~~simulate~~

> **simulate**: \<`calls`\>(`args`) => `Promise`\<`SimulateBlocksReturnType`\<`calls`\>\>

###### Type Parameters

| Type Parameter |
| ------ |
| `calls` *extends* readonly `unknown`[] |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `SimulateBlocksParameters`\<`calls`\> |

###### Returns

`Promise`\<`SimulateBlocksReturnType`\<`calls`\>\>

###### Deprecated

Use `simulateBlocks` instead.

##### simulateBlocks

> **simulateBlocks**: \<`calls`\>(`args`) => `Promise`\<`SimulateBlocksReturnType`\<`calls`\>\>

Simulates a set of calls on block(s) with optional block and state overrides.

###### Type Parameters

| Type Parameter |
| ------ |
| `calls` *extends* readonly `unknown`[] |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `SimulateBlocksParameters`\<`calls`\> |

###### Returns

`Promise`\<`SimulateBlocksReturnType`\<`calls`\>\>

Simulated blocks. SimulateReturnType

###### Example

```ts
import { createPublicClient, http, parseEther } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const result = await client.simulateBlocks({
  blocks: [{
    blockOverrides: {
      number: 69420n,
    },
    calls: [{
      {
        account: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
        data: '0xdeadbeef',
        to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      },
      {
        account: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
        to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        value: parseEther('1'),
      },
    }],
    stateOverrides: [{
      address: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
      balance: parseEther('10'),
    }],
  }]
})
```

##### simulateCalls

> **simulateCalls**: \<`calls`\>(`args`) => `Promise`\<`SimulateCallsReturnType`\<`calls`\>\>

Simulates a set of calls.

###### Type Parameters

| Type Parameter |
| ------ |
| `calls` *extends* readonly `unknown`[] |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `SimulateCallsParameters`\<`calls`\> |

###### Returns

`Promise`\<`SimulateCallsReturnType`\<`calls`\>\>

Results. SimulateCallsReturnType

###### Example

```ts
import { createPublicClient, http, parseEther } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const result = await client.simulateCalls({
  account: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
  calls: [{
    {
      data: '0xdeadbeef',
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    },
    {
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: parseEther('1'),
    },
  ]
})
```

##### simulateContract

> **simulateContract**: \<`abi`, `functionName`, `args`, `chainOverride`, `accountOverride`\>(`args`) => `Promise`\<`SimulateContractReturnType`\<`abi`, `functionName`, `args`, `Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `accountOverride`\>\>

Simulates/validates a contract interaction. This is useful for retrieving **return data** and **revert reasons** of contract write functions.

- Docs: https://viem.sh/docs/contract/simulateContract
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts_writing-to-contracts

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] | - |
| `functionName` *extends* `string` | - |
| `args` *extends* `unknown` | - |
| `chainOverride` *extends* `Chain` \| `undefined` | - |
| `accountOverride` *extends* `` `0x${string}` `` \| `Account` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SimulateContractParameters`\<`abi`, `functionName`, `args`, `Chain` \| `undefined`, `chainOverride`, `accountOverride`\> | SimulateContractParameters |

###### Returns

`Promise`\<`SimulateContractReturnType`\<`abi`, `functionName`, `args`, `Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`, `accountOverride`\>\>

The simulation result and write request. SimulateContractReturnType

###### Remarks

This function does not require gas to execute and _**does not**_ change the state of the blockchain. It is almost identical to [`readContract`](https://viem.sh/docs/contract/readContract), but also supports contract write functions.

Internally, uses a [Public Client](https://viem.sh/docs/clients/public) to call the [`call` action](https://viem.sh/docs/actions/public/call) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const result = await client.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint(uint32) view returns (uint32)']),
  functionName: 'mint',
  args: ['69420'],
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
})
```

##### snapshot

> **snapshot**: () => `Promise`\<`` `0x${string}` ``\>

Snapshot the state of the blockchain at the current block.

- Docs: https://viem.sh/docs/actions/test/snapshot

###### Returns

`Promise`\<`` `0x${string}` ``\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'
import { snapshot } from 'viem/test'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.snapshot()
```

##### stopImpersonatingAccount

> **stopImpersonatingAccount**: (`args`) => `Promise`\<`void`\>

Stop impersonating an account after having previously used [`impersonateAccount`](https://viem.sh/docs/actions/test/impersonateAccount).

- Docs: https://viem.sh/docs/actions/test/stopImpersonatingAccount

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `StopImpersonatingAccountParameters` | – StopImpersonatingAccountParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createTestClient, http } from 'viem'
import { foundry } from 'viem/chains'
import { stopImpersonatingAccount } from 'viem/test'

const client = createTestClient({
  mode: 'anvil',
  chain: 'foundry',
  transport: http(),
})
await client.stopImpersonatingAccount({
  address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
})
```

##### switchChain

> **switchChain**: (`args`) => `Promise`\<`void`\>

Switch the target chain in a wallet.

- Docs: https://viem.sh/docs/actions/wallet/switchChain
- JSON-RPC Methods: [`eth_switchEthereumChain`](https://eips.ethereum.org/EIPS/eip-3326)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `SwitchChainParameters` | SwitchChainParameters |

###### Returns

`Promise`\<`void`\>

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet, optimism } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
await client.switchChain({ id: optimism.id })
```

##### tevmCall

> **tevmCall**: `CallHandler`

Low-level call/transaction API. To send a transaction (rather than a call), pass `createTransaction: true`
and mine the result (or use `miningConfig: { type: 'auto' }`). Supports impersonation (`from`/`caller`/`origin`),
`depth`, `createTrace`, `createAccessList`, and more.

###### See

 - [CallParams](https://tevm.sh/reference/tevm/actions/type-aliases/callparams/)
 - [CallResult](https://tevm.sh/reference/tevm/actions/type-aliases/callresult/)

##### tevmContract

> **tevmContract**: `ContractHandler`

Higher-level contract call: handles ABI encoding/decoding and revert messages. Same options as
`tevmCall` apply (impersonation, tracing, access list, `createTransaction`).

###### See

 - [ContractParams](https://tevm.sh/reference/tevm/actions/type-aliases/contractparams/)
 - [ContractResult](https://tevm.sh/reference/tevm/actions/type-aliases/contractresult/)

##### tevmDeal

> **tevmDeal**: `AnvilDealHandler`

Convenience wrapper over `tevmSetAccount` for setting ETH or ERC20 balances.

###### See

 - [DealParams](https://tevm.sh/reference/tevm/actions/type-aliases/dealparams/)
 - [DealResult](https://tevm.sh/reference/tevm/actions/type-aliases/dealresult/)

###### Example

```typescript
await client.tevmDeal({
  erc20: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  amount: 1000000n,
})
```

##### tevmDeploy

> **tevmDeploy**: `DeployHandler`

Deploys a contract with encoded constructor arguments. Inherits all `tevmCall` options.

###### See

 - [DeployParams](https://tevm.sh/reference/tevm/actions/type-aliases/deployparams/)
 - [DeployResult](https://tevm.sh/reference/tevm/actions/type-aliases/deployresult/)

##### tevmDumpState

> **tevmDumpState**: `DumpStateHandler`

Dumps the EVM state as a JSON-serializable object for persistence.

##### tevmGetAccount

> **tevmGetAccount**: `GetAccountHandler`

Reads an account's state. Storage is only included if `returnStorage: true`, and in fork mode only
already-cached slots are returned.

###### See

 - [GetAccountParams](https://tevm.sh/reference/tevm/actions/type-aliases/getaccountparams/)
 - [GetAccountResult](https://tevm.sh/reference/tevm/actions/type-aliases/getaccountresult/)

##### tevmLoadState

> **tevmLoadState**: `LoadStateHandler`

Loads a previously dumped state into the EVM.

##### tevmMine

> **tevmMine**: `MineHandler`

Mines pending transactions into a new block. Required in manual mining mode to advance canonical state.

##### tevmReady

> **tevmReady**: () => `Promise`\<`true`\>

Resolves when the TEVM is ready. All other actions await this implicitly. Equivalent to `client.transport.tevm.ready()`.

###### Returns

`Promise`\<`true`\>

##### tevmSetAccount

> **tevmSetAccount**: `SetAccountHandler`

Directly sets any property of an account (balance, nonce, deployedBytecode, storage).

###### See

 - [SetAccountParams](https://tevm.sh/reference/tevm/actions/type-aliases/setaccountparams/)
 - [SetAccountResult](https://tevm.sh/reference/tevm/actions/type-aliases/setaccountresult/)

##### transport

> **transport**: `TransportConfig`\<`string`\> & `object`

The RPC transport

###### Type Declaration

###### tevm

> **tevm**: `object` & `EIP1193Events` & `object` & `object`

###### Type Declaration

###### addSnapshot

> `readonly` **addSnapshot**: (`stateRoot`, `state`, `metadata?`) => `string`

Adds a new snapshot and returns its ID (hex string like "0x1")
Used by evm_snapshot RPC method

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `stateRoot` | `string` |
| `state` | `TevmState` |
| `metadata?` | `SnapshotMetadata` |

###### Returns

`string`

###### close

> `readonly` **close**: () => `void`

Closes the client and stops any running interval mining.
This should be called when the client is no longer needed to prevent resource leaks.

###### Returns

`void`

###### Example

```ts
const client = createTevmNode({
  miningConfig: { type: 'interval', blockTime: 5 }
})

// Use the client...

// Clean up when done
client.close()
```

###### consensus

> `readonly` **consensus**: `ConsensusService`

Consensus service used for trust assumptions and proof-backed reads.

###### debug?

> `readonly` `optional` **debug?**: () => `Promise`\<\{ `blocks`: ...; `chainId`: ...; `chainName`: ...; `eips`: ...; `hardfork`: ...; `miningConfig`: ...; `mode`: ...; `receipts`: ...; `registeredFilters`: ...; `state`: ...; `status`: ...; `txsInMempool`: ...; \}\>

Returns debug information about the current node state
including chain details, status, mode, mining config, filters,
blocks, mempool transactions, and state

###### Returns

`Promise`\<\{ `blocks`: ...; `chainId`: ...; `chainName`: ...; `eips`: ...; `hardfork`: ...; `miningConfig`: ...; `mode`: ...; `receipts`: ...; `registeredFilters`: ...; `state`: ...; `status`: ...; `txsInMempool`: ...; \}\>

###### deepCopy

> `readonly` **deepCopy**: () => `Promise`\<`TevmNode`\<... \| ..., \{ \}\>\>

Copies the current client state into a new client

###### Returns

`Promise`\<`TevmNode`\<... \| ..., \{ \}\>\>

###### deleteSnapshotsFrom

> `readonly` **deleteSnapshotsFrom**: (`snapshotId`) => `void`

Deletes snapshots with IDs greater than or equal to the given ID
This is needed because reverting invalidates all subsequent snapshots

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshotId` | `string` |

###### Returns

`void`

###### emitExExEvent

> `readonly` **emitExExEvent**: (`event`) => `Promise`\<`void`\>

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ExExEvent` |

###### Returns

`Promise`\<`void`\>

###### extend

> `readonly` **extend**: \<`TExtension`\>(`decorator`) => `TevmNode`\<`"fork"` \| `"normal"`, `object` & `TExtension`\>

Extends the base client with additional functionality. This enables optimal code splitting
and extensibility

###### Type Parameters

| Type Parameter |
| ------ |
| `TExtension` *extends* `Record`\<`string`, `any`\> |

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `decorator` | (`client`) => `TExtension` |

###### Returns

`TevmNode`\<`"fork"` \| `"normal"`, `object` & `TExtension`\>

###### forkTransport?

> `readonly` `optional` **forkTransport?**: `object`

Client to make json rpc requests to a forked node

###### Type Declaration

###### Example

```ts
const client = createMemoryClient({ request: eip1193RequestFn })
```

###### forkTransport.request

> **request**: `EIP1193RequestFn`

###### getAutoImpersonate

> `readonly` **getAutoImpersonate**: () => `boolean`

Gets whether auto-impersonation is enabled.
When enabled, all transaction senders are automatically impersonated.

###### Returns

`boolean`

###### getBlockTimestampInterval

> `readonly` **getBlockTimestampInterval**: () => `bigint` \| `undefined`

Gets the automatic timestamp interval added between blocks
If undefined, no automatic interval is applied

###### Returns

`bigint` \| `undefined`

###### getFilters

> `readonly` **getFilters**: () => `Map`\<`` `0x${string}` ``, `Filter`\>

Gets all registered filters mapped by id

###### Returns

`Map`\<`` `0x${string}` ``, `Filter`\>

###### getImpersonatedAccount

> `readonly` **getImpersonatedAccount**: () => `` `0x${string}` `` \| `undefined`

The currently impersonated account. This is only used in `fork` mode

###### Returns

`` `0x${string}` `` \| `undefined`

###### getLightSyncStatus

> `readonly` **getLightSyncStatus**: () => `Readonly`\<`LightSyncStatus`\>

###### Returns

`Readonly`\<`LightSyncStatus`\>

###### getMinGasPrice

> `readonly` **getMinGasPrice**: () => `bigint` \| `undefined`

Gets the minimum gas price for transactions
If undefined, no minimum gas price is enforced

###### Returns

`bigint` \| `undefined`

###### getNextBlockBaseFeePerGas

> `readonly` **getNextBlockBaseFeePerGas**: () => `bigint` \| `undefined`

Gets the base fee per gas to use for the next block
If undefined, the base fee will be calculated from the parent block

###### Returns

`bigint` \| `undefined`

###### getNextBlockGasLimit

> `readonly` **getNextBlockGasLimit**: () => `bigint` \| `undefined`

Gets the gas limit to use for subsequent blocks
If undefined, the parent block's gas limit will be used

###### Returns

`bigint` \| `undefined`

###### getNextBlockPrevRandao

> `readonly` **getNextBlockPrevRandao**: () => `bigint` \| `undefined`

Gets the prevRandao to use for the next block
If undefined, the parent block's mixHash will be used

###### Returns

`bigint` \| `undefined`

###### getNextBlockTimestamp

> `readonly` **getNextBlockTimestamp**: () => `bigint` \| `undefined`

Gets the timestamp to use for the next block
If undefined, the current time will be used

###### Returns

`bigint` \| `undefined`

###### getReceiptsManager

> `readonly` **getReceiptsManager**: () => `Promise`\<`ReceiptsManager`\>

Interface for querying receipts and historical state

###### Returns

`Promise`\<`ReceiptsManager`\>

###### getSnapshot

> `readonly` **getSnapshot**: (`snapshotId`) => `TevmSnapshot` \| `undefined`

Gets a snapshot by ID
Used by evm_revert RPC method

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshotId` | `string` |

###### Returns

`TevmSnapshot` \| `undefined`

###### getSnapshots

> `readonly` **getSnapshots**: () => `Map`\<`string`, `TevmSnapshot`\>

Gets all stored snapshots for evm_snapshot/evm_revert

###### Returns

`Map`\<`string`, `TevmSnapshot`\>

###### getStrictImpersonation

> `readonly` **getStrictImpersonation**: () => `boolean`

Gets whether strict impersonation is enabled.
When enabled, tevm emulates anvil: sending a transaction from an address that is
neither a prefunded dev account nor actively impersonated throws a
`NoSignerAvailableError`. Defaults to false, which keeps tevm's permissive
auto-impersonation behavior.

###### Returns

`boolean`

###### getTracesEnabled

> `readonly` **getTracesEnabled**: () => `boolean`

Gets whether automatic tracing is enabled.
When enabled, all transactions include traces in their responses.

###### Returns

`boolean`

###### getTxPool

> `readonly` **getTxPool**: () => `Promise`\<`TxPool`\>

Gets the pool of pending transactions to be included in next block

###### Returns

`Promise`\<`TxPool`\>

###### getVm

> `readonly` **getVm**: () => `Promise`\<`Vm`\>

Internal instance of the VM. Can be used for lower level operations.
Normally not recomended to use unless building libraries or extensions
on top of Tevm.

###### Returns

`Promise`\<`Vm`\>

###### logger

> `readonly` **logger**: `Logger`

The logger instance

###### miningConfig

> **miningConfig**: `MiningConfig`

The configuration for mining. Defaults to 'auto'
- 'auto' will mine a block on every transaction
- 'interval' will mine a block every `interval` seconds
- 'manual' will not mine a block automatically and requires a manual call to `mineBlock`

###### mode

> `readonly` **mode**: `"fork"` \| `"normal"`

The mode the current client is running in
`fork` mode will fetch and cache all state from the block forked from the provided URL
`normal` mode will not fetch any state and will only run the EVM in memory

###### Example

```ts
let client = createMemoryClient()
console.log(client.mode) // 'normal'
client = createMemoryClient({ forkUrl: 'https://mainnet.infura.io/v3/your-api-key' })
console.log(client.mode) // 'fork'
```

###### ready

> `readonly` **ready**: () => `Promise`\<`true`\>

Returns promise that resulves when the client is ready
The client is usable without calling this method but may
have extra latency on the first call from initialization

###### Returns

`Promise`\<`true`\>

###### Example

```ts
const client = createMemoryClient()
await client.ready()
```

###### registerExExHook

> `readonly` **registerExExHook**: (`hook`) => () => `void`

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | `ExExHook` |

###### Returns

() => `void`

###### removeFilter

> `readonly` **removeFilter**: (`id`) => `void`

Removes a filter by id

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `` `0x${string}` `` |

###### Returns

`void`

###### setAutoImpersonate

> `readonly` **setAutoImpersonate**: (`enabled`) => `void`

Sets whether to automatically impersonate all transaction senders.
When enabled, all transactions will have their sender automatically impersonated.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `enabled` | `boolean` |

###### Returns

`void`

###### setBlockTimestampInterval

> `readonly` **setBlockTimestampInterval**: (`interval`) => `void`

Sets the automatic timestamp interval to add between blocks.
This is used by the anvil_setBlockTimestampInterval RPC method.
Pass undefined to clear the interval.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `interval` | `bigint` \| `undefined` |

###### Returns

`void`

###### setFilter

> `readonly` **setFilter**: (`filter`) => `void`

Creates a new filter to watch for logs events and blocks

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `filter` | `Filter` |

###### Returns

`void`

###### setImpersonatedAccount

> `readonly` **setImpersonatedAccount**: (`address`) => `void`

Sets the account to impersonate. This will allow the client to act as if it is that account
On Ethereum JSON_RPC endpoints. Pass in undefined to stop impersonating

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `` `0x${string}` `` \| `undefined` |

###### Returns

`void`

###### setMinGasPrice

> `readonly` **setMinGasPrice**: (`minGasPrice`) => `void`

Sets the minimum gas price for transactions.
Transactions with a gas price below this value will be rejected.
This is used by the anvil_setMinGasPrice RPC method.
Pass undefined to clear the minimum.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `minGasPrice` | `bigint` \| `undefined` |

###### Returns

`void`

###### setMiningConfig

> `readonly` **setMiningConfig**: (`config`) => `void`

Updates the mining configuration and handles any necessary state changes.
This method properly starts/stops interval mining as needed.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `MiningConfig` | The new mining configuration |

###### Returns

`void`

###### Example

```ts
const client = createTevmNode()

// Switch to interval mining
client.setMiningConfig({ type: 'interval', blockTime: 5 })

// Switch to manual mining
client.setMiningConfig({ type: 'manual' })
```

###### setNextBlockBaseFeePerGas

> `readonly` **setNextBlockBaseFeePerGas**: (`baseFeePerGas`) => `void`

Sets the base fee per gas for the next block (EIP-1559).
This only affects the immediate next block, then is cleared.
This is used by the anvil_setNextBlockBaseFeePerGas RPC method.
Pass undefined to clear the override.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `baseFeePerGas` | `bigint` \| `undefined` |

###### Returns

`void`

###### setNextBlockGasLimit

> `readonly` **setNextBlockGasLimit**: (`gasLimit`) => `void`

Sets the gas limit for subsequent blocks.
Unlike setNextBlockTimestamp, this persists across blocks.
This is used by the anvil/evm_setBlockGasLimit RPC method.
Pass undefined to clear the override and use parent block's gas limit.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `gasLimit` | `bigint` \| `undefined` |

###### Returns

`void`

###### setNextBlockPrevRandao

> `readonly` **setNextBlockPrevRandao**: (`prevRandao`) => `void`

Sets the prevRandao for the next block.
This only affects the immediate next block, then is cleared.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `prevRandao` | `bigint` \| `undefined` |

###### Returns

`void`

###### setNextBlockTimestamp

> `readonly` **setNextBlockTimestamp**: (`timestamp`) => `void`

Sets the timestamp for the next block.
This is used by the anvil/evm_setNextBlockTimestamp RPC method.
Pass undefined to clear the override and use current time.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `timestamp` | `bigint` \| `undefined` |

###### Returns

`void`

###### setStrictImpersonation

> `readonly` **setStrictImpersonation**: (`enabled`) => `void`

Sets whether to enforce strict impersonation.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `enabled` | `boolean` |

###### Returns

`void`

###### See

[getStrictImpersonation](#createsessionmanager)

###### setTracesEnabled

> `readonly` **setTracesEnabled**: (`enabled`) => `void`

Sets whether to automatically collect traces for all transactions.
When enabled, all executed transactions include traces in their responses.
Note: This has performance and memory overhead.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `enabled` | `boolean` |

###### Returns

`void`

###### status

> **status**: `"INITIALIZING"` \| `"READY"` \| `"SYNCING"` \| `"MINING"` \| `"STOPPED"`

Returns status of the client
- INITIALIZING: The client is initializing
- READY: The client is ready to be used
- SYNCING: The client is syncing with the forked node
- MINING: The client is mining a block

###### Type Declaration

###### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Emit an event.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `eventName` | keyof `EIP1193EventMap` | The event name. |
| ...`args` | `any`[] | Arguments to pass to the event listeners. |

###### Returns

`boolean`

True if the event was emitted, false otherwise.

###### Type Declaration

###### request

> **request**: `EIP1193RequestFn`

##### type

> **type**: `string`

The type of client.

##### uid

> **uid**: `string`

A unique ID for the client.

##### uninstallFilter

> **uninstallFilter**: (`args`) => `Promise`\<`boolean`\>

Destroys a Filter that was created from one of the following Actions:

- [`createBlockFilter`](https://viem.sh/docs/actions/public/createBlockFilter)
- [`createEventFilter`](https://viem.sh/docs/actions/public/createEventFilter)
- [`createPendingTransactionFilter`](https://viem.sh/docs/actions/public/createPendingTransactionFilter)

- Docs: https://viem.sh/docs/actions/public/uninstallFilter
- JSON-RPC Methods: [`eth_uninstallFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_uninstallFilter)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `UninstallFilterParameters` | UninstallFilterParameters |

###### Returns

`Promise`\<`boolean`\>

A boolean indicating if the Filter was successfully uninstalled. UninstallFilterReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { createPendingTransactionFilter, uninstallFilter } from 'viem/public'

const filter = await client.createPendingTransactionFilter()
const uninstalled = await client.uninstallFilter({ filter })
// true
```

##### verifyHash

> **verifyHash**: (`args`) => `Promise`\<`boolean`\>

Verify that a hash was signed by the provided address.

- Docs [https://viem.sh/docs/actions/public/verifyHash](https://viem.sh/docs/actions/public/verifyHash)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `VerifyHashParameters` |

###### Returns

`Promise`\<`boolean`\>

Whether or not the signature is valid. VerifyHashReturnType

##### verifyMessage

> **verifyMessage**: (`args`) => `Promise`\<`boolean`\>

Verify that a message was signed by the provided address.

Compatible with Smart Contract Accounts & Externally Owned Accounts via [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492).

- Docs [https://viem.sh/docs/actions/public/verifyMessage](https://viem.sh/docs/actions/public/verifyMessage)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `address`: `` `0x${string}` ``; `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `chain?`: `Chain` \| `null`; `erc6492VerifierAddress?`: `` `0x${string}` ``; `factory?`: `` `0x${string}` ``; `factoryData?`: `` `0x${string}` ``; `message`: `SignableMessage`; `mode?`: `string` & `object` \| `"auto"` \| `"eoa"`; `multicallAddress?`: `` `0x${string}` ``; `signature`: `` `0x${string}` `` \| `ByteArray` \| `Signature`; `universalSignatureVerifierAddress?`: `` `0x${string}` ``; \} | - |
| `args.address` | `` `0x${string}` `` | The address that signed the original message. |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.chain?` | `Chain` \| `null` | The chain to use. |
| `args.erc6492VerifierAddress?` | `` `0x${string}` `` | The address of the ERC-6492 signature verifier contract. |
| `args.factory?` | `` `0x${string}` `` | - |
| `args.factoryData?` | `` `0x${string}` `` | - |
| `args.message` | `SignableMessage` | The message to be verified. |
| `args.mode?` | `string` & `object` \| `"auto"` \| `"eoa"` | Chooses which verification path to try first before falling back. |
| `args.multicallAddress?` | `` `0x${string}` `` | Multicall3 address for ERC-8010 verification. |
| `args.signature` | `` `0x${string}` `` \| `ByteArray` \| `Signature` | The signature that was generated by signing the message with the address's private key. |
| `args.universalSignatureVerifierAddress?` | `` `0x${string}` `` | **Deprecated** use `erc6492VerifierAddress` instead. |

###### Returns

`Promise`\<`boolean`\>

Whether or not the signature is valid. VerifyMessageReturnType

##### verifySiweMessage

> **verifySiweMessage**: (`args`) => `Promise`\<`boolean`\>

Verifies [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) formatted message was signed.

Compatible with Smart Contract Accounts & Externally Owned Accounts via [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492).

- Docs [https://viem.sh/docs/siwe/actions/verifySiweMessage](https://viem.sh/docs/siwe/actions/verifySiweMessage)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | \{ `address?`: `` `0x${string}` ``; `blockNumber?`: `bigint`; `blockTag?`: `BlockTag`; `domain?`: `string`; `message`: `string`; `nonce?`: `string`; `scheme?`: `string`; `signature`: `` `0x${string}` ``; `time?`: `Date`; \} | - |
| `args.address?` | `` `0x${string}` `` | Ethereum address to check against. |
| `args.blockNumber?` | `bigint` | The balance of the account at a block number. |
| `args.blockTag?` | `BlockTag` | The balance of the account at a block tag. **Default** `'latest'` |
| `args.domain?` | `string` | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) authority to check against. |
| `args.message` | `string` | EIP-4361 formatted message. |
| `args.nonce?` | `string` | Random string to check against. |
| `args.scheme?` | `string` | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986#section-3.1) URI scheme to check against. |
| `args.signature` | `` `0x${string}` `` | Signature to check against. |
| `args.time?` | `Date` | Current time to check optional `expirationTime` and `notBefore` fields. **Default** `new Date()` |

###### Returns

`Promise`\<`boolean`\>

Whether or not the signature is valid. VerifySiweMessageReturnType

##### verifyTypedData

> **verifyTypedData**: (`args`) => `Promise`\<`boolean`\>

Verify that typed data was signed by the provided address.

- Docs [https://viem.sh/docs/actions/public/verifyTypedData](https://viem.sh/docs/actions/public/verifyTypedData)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `VerifyTypedDataParameters` |

###### Returns

`Promise`\<`boolean`\>

Whether or not the signature is valid. VerifyTypedDataReturnType

##### waitForCallsStatus

> **waitForCallsStatus**: (`parameters`) => `Promise`\<\{ `atomic`: `boolean`; `capabilities?`: \{\[`key`: `string`\]: `any`; \} \| \{\[`key`: `string`\]: `any`; \}; `chainId`: `number`; `id`: `string`; `receipts?`: `WalletCallReceipt`\<`bigint`, `"success"` \| `"reverted"`\>[]; `status`: `"pending"` \| `"success"` \| `"failure"` \| `undefined`; `statusCode`: `number`; `version`: `string`; \}\>

Waits for the status & receipts of a call bundle that was sent via `sendCalls`.

- Docs: https://viem.sh/docs/actions/wallet/waitForCallsStatus
- JSON-RPC Methods: [`wallet_getCallsStatus`](https://eips.ethereum.org/EIPS/eip-5792)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parameters` | `WaitForCallsStatusParameters` | WaitForCallsStatusParameters |

###### Returns

`Promise`\<\{ `atomic`: `boolean`; `capabilities?`: \{\[`key`: `string`\]: `any`; \} \| \{\[`key`: `string`\]: `any`; \}; `chainId`: `number`; `id`: `string`; `receipts?`: `WalletCallReceipt`\<`bigint`, `"success"` \| `"reverted"`\>[]; `status`: `"pending"` \| `"success"` \| `"failure"` \| `undefined`; `statusCode`: `number`; `version`: `string`; \}\>

Status & receipts of the call bundle. WaitForCallsStatusReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

const { receipts, status } = await waitForCallsStatus(client, { id: '0xdeadbeef' })
```

##### waitForTransactionReceipt

> **waitForTransactionReceipt**: (`args`) => `Promise`\<`TransactionReceipt`\>

Waits for the [Transaction](https://viem.sh/docs/glossary/terms#transaction) to be included on a [Block](https://viem.sh/docs/glossary/terms#block) (one confirmation), and then returns the [Transaction Receipt](https://viem.sh/docs/glossary/terms#transaction-receipt). If the Transaction reverts, then the action will throw an error.

- Docs: https://viem.sh/docs/actions/public/waitForTransactionReceipt
- Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_sending-transactions
- JSON-RPC Methods:
  - Polls [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionReceipt) on each block until it has been processed.
  - If a Transaction has been replaced:
    - Calls [`eth_getBlockByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblockbynumber) and extracts the transactions
    - Checks if one of the Transactions is a replacement
    - If so, calls [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionReceipt).

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WaitForTransactionReceiptParameters`\<`Chain` \| `undefined`\> | WaitForTransactionReceiptParameters |

###### Returns

`Promise`\<`TransactionReceipt`\>

The transaction receipt. WaitForTransactionReceiptReturnType

###### Remarks

The `waitForTransactionReceipt` action additionally supports Replacement detection (e.g. sped up Transactions).

Transactions can be replaced when a user modifies their transaction in their wallet (to speed up or cancel). Transactions are replaced when they are sent from the same nonce.

There are 3 types of Transaction Replacement reasons:

- `repriced`: The gas price has been modified (e.g. different `maxFeePerGas`)
- `cancelled`: The Transaction has been cancelled (e.g. `value === 0n`)
- `replaced`: The Transaction has been replaced (e.g. different `value` or `data`)

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const transactionReceipt = await client.waitForTransactionReceipt({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
})
```

##### watchAsset

> **watchAsset**: (`args`) => `Promise`\<`boolean`\>

Adds an EVM chain to the wallet.

- Docs: https://viem.sh/docs/actions/wallet/watchAsset
- JSON-RPC Methods: [`eth_switchEthereumChain`](https://eips.ethereum.org/EIPS/eip-747)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WatchAssetParams` | WatchAssetParameters |

###### Returns

`Promise`\<`boolean`\>

Boolean indicating if the token was successfully added. WatchAssetReturnType

###### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const success = await client.watchAsset({
  type: 'ERC20',
  options: {
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    decimals: 18,
    symbol: 'WETH',
  },
})
```

##### watchBlockNumber

> **watchBlockNumber**: (`args`) => `WatchBlockNumberReturnType`

Watches and returns incoming block numbers.

- Docs: https://viem.sh/docs/actions/public/watchBlockNumber
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_watching-blocks
- JSON-RPC Methods:
  - When `poll: true`, calls [`eth_blockNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blocknumber) on a polling interval.
  - When `poll: false` & WebSocket Transport, uses a WebSocket subscription via [`eth_subscribe`](https://docs.alchemy.com/reference/eth-subscribe-polygon) and the `"newHeads"` event.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WatchBlockNumberParameters` | WatchBlockNumberParameters |

###### Returns

`WatchBlockNumberReturnType`

A function that can be invoked to stop watching for new block numbers. WatchBlockNumberReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const unwatch = await client.watchBlockNumber({
  onBlockNumber: (blockNumber) => console.log(blockNumber),
})
```

##### watchBlocks

> **watchBlocks**: \<`includeTransactions`, `blockTag`\>(`args`) => `WatchBlocksReturnType`

Watches and returns information for incoming blocks.

- Docs: https://viem.sh/docs/actions/public/watchBlocks
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_watching-blocks
- JSON-RPC Methods:
  - When `poll: true`, calls [`eth_getBlockByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getBlockByNumber) on a polling interval.
  - When `poll: false` & WebSocket Transport, uses a WebSocket subscription via [`eth_subscribe`](https://docs.alchemy.com/reference/eth-subscribe-polygon) and the `"newHeads"` event.

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `includeTransactions` *extends* `boolean` | `false` |
| `blockTag` *extends* `BlockTag` | `"latest"` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WatchBlocksParameters`\<`TevmTransport`, `Chain` \| `undefined`, `includeTransactions`, `blockTag`\> | WatchBlocksParameters |

###### Returns

`WatchBlocksReturnType`

A function that can be invoked to stop watching for new block numbers. WatchBlocksReturnType

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const unwatch = await client.watchBlocks({
  onBlock: (block) => console.log(block),
})
```

##### watchContractEvent

> **watchContractEvent**: \<`abi`, `eventName`, `strict`\>(`args`) => `WatchContractEventReturnType`

Watches and returns emitted contract event logs.

- Docs: https://viem.sh/docs/contract/watchContractEvent

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] | - |
| `eventName` *extends* `string` | - |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WatchContractEventParameters`\<`abi`, `eventName`, `strict`, `TevmTransport`\> | WatchContractEventParameters |

###### Returns

`WatchContractEventReturnType`

A function that can be invoked to stop watching for new event logs. WatchContractEventReturnType

###### Remarks

This Action will batch up all the event logs found within the [`pollingInterval`](https://viem.sh/docs/contract/watchContractEvent#pollinginterval-optional), and invoke them via [`onLogs`](https://viem.sh/docs/contract/watchContractEvent#onLogs).

`watchContractEvent` will attempt to create an [Event Filter](https://viem.sh/docs/contract/createContractEventFilter) and listen to changes to the Filter per polling interval, however, if the RPC Provider does not support Filters (e.g. `eth_newFilter`), then `watchContractEvent` will fall back to using [`getLogs`](https://viem.sh/docs/actions/public/getLogs) instead.

###### Example

```ts
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const unwatch = client.watchContractEvent({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']),
  eventName: 'Transfer',
  args: { from: '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b' },
  onLogs: (logs) => console.log(logs),
})
```

##### watchEvent

> **watchEvent**: \<`abiEvent`, `abiEvents`, `strict`\>(`args`) => `WatchEventReturnType`

Watches and returns emitted [Event Logs](https://viem.sh/docs/glossary/terms#event-log).

- Docs: https://viem.sh/docs/actions/public/watchEvent
- JSON-RPC Methods:
  - **RPC Provider supports `eth_newFilter`:**
    - Calls [`eth_newFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newfilter) to create a filter (called on initialize).
    - On a polling interval, it will call [`eth_getFilterChanges`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterchanges).
  - **RPC Provider does not support `eth_newFilter`:**
    - Calls [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs) for each block between the polling interval.

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abiEvent` *extends* `AbiEvent` \| `undefined` | `undefined` |
| `abiEvents` *extends* readonly `unknown`[] \| readonly `AbiEvent`[] \| `undefined` | `abiEvent` *extends* `AbiEvent` ? \[`abiEvent`\] : `undefined` |
| `strict` *extends* `boolean` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WatchEventParameters`\<`abiEvent`, `abiEvents`, `strict`, `TevmTransport`\> | WatchEventParameters |

###### Returns

`WatchEventReturnType`

A function that can be invoked to stop watching for new Event Logs. WatchEventReturnType

###### Remarks

This Action will batch up all the Event Logs found within the [`pollingInterval`](https://viem.sh/docs/actions/public/watchEvent#pollinginterval-optional), and invoke them via [`onLogs`](https://viem.sh/docs/actions/public/watchEvent#onLogs).

`watchEvent` will attempt to create an [Event Filter](https://viem.sh/docs/actions/public/createEventFilter) and listen to changes to the Filter per polling interval, however, if the RPC Provider does not support Filters (e.g. `eth_newFilter`), then `watchEvent` will fall back to using [`getLogs`](https://viem.sh/docs/actions/public/getLogs) instead.

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const unwatch = client.watchEvent({
  onLogs: (logs) => console.log(logs),
})
```

##### watchPendingTransactions

> **watchPendingTransactions**: (`args`) => `WatchPendingTransactionsReturnType`

Watches and returns pending transaction hashes.

- Docs: https://viem.sh/docs/actions/public/watchPendingTransactions
- JSON-RPC Methods:
  - When `poll: true`
    - Calls [`eth_newPendingTransactionFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newpendingtransactionfilter) to initialize the filter.
    - Calls [`eth_getFilterChanges`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getFilterChanges) on a polling interval.
  - When `poll: false` & WebSocket Transport, uses a WebSocket subscription via [`eth_subscribe`](https://docs.alchemy.com/reference/eth-subscribe-polygon) and the `"newPendingTransactions"` event.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WatchPendingTransactionsParameters`\<`TevmTransport`\> | WatchPendingTransactionsParameters |

###### Returns

`WatchPendingTransactionsReturnType`

A function that can be invoked to stop watching for new pending transaction hashes. WatchPendingTransactionsReturnType

###### Remarks

This Action will batch up all the pending transactions found within the [`pollingInterval`](https://viem.sh/docs/actions/public/watchPendingTransactions#pollinginterval-optional), and invoke them via [`onTransactions`](https://viem.sh/docs/actions/public/watchPendingTransactions#ontransactions).

###### Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
const unwatch = await client.watchPendingTransactions({
  onTransactions: (hashes) => console.log(hashes),
})
```

##### writeContract

> **writeContract**: \<`abi`, `functionName`, `args`, `chainOverride`\>(`args`) => `Promise`\<`` `0x${string}` ``\>

Executes a write function on a contract.

- Docs: https://viem.sh/docs/contract/writeContract
- Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts_writing-to-contracts

A "write" function on a Solidity contract modifies the state of the blockchain. These types of functions require gas to be executed, and hence a [Transaction](https://viem.sh/docs/glossary/terms) is needed to be broadcast in order to change the state.

Internally, uses a [Wallet Client](https://viem.sh/docs/clients/wallet) to call the [`sendTransaction` action](https://viem.sh/docs/actions/wallet/sendTransaction) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).

__Warning: The `write` internally sends a transaction – it does not validate if the contract write will succeed (the contract may throw an error). It is highly recommended to [simulate the contract write with `contract.simulate`](https://viem.sh/docs/contract/writeContract#usage) before you execute it.__

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] | - |
| `functionName` *extends* `string` | - |
| `args` *extends* `unknown` | - |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WriteContractParameters`\<`abi`, `functionName`, `args`, `Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`\> | WriteContractParameters |

###### Returns

`Promise`\<`` `0x${string}` ``\>

A [Transaction Hash](https://viem.sh/docs/glossary/terms#hash). WriteContractReturnType

###### Examples

```ts
import { createWalletClient, custom, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const hash = await client.writeContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
  functionName: 'mint',
  args: [69420],
})
```

```ts
// With Validation
import { createWalletClient, custom, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const { request } = await client.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
  functionName: 'mint',
  args: [69420],
}
const hash = await client.writeContract(request)
```

##### writeContractSync

> **writeContractSync**: \<`abi`, `functionName`, `args`, `chainOverride`\>(`args`) => `Promise`\<`TransactionReceipt`\>

Executes a write function on a contract synchronously.
Returns the transaction receipt.

- Docs: https://viem.sh/docs/contract/writeContract

A "write" function on a Solidity contract modifies the state of the blockchain. These types of functions require gas to be executed, and hence a [Transaction](https://viem.sh/docs/glossary/terms) is needed to be broadcast in order to change the state.

Internally, uses a [Wallet Client](https://viem.sh/docs/clients/wallet) to call the [`sendTransaction` action](https://viem.sh/docs/actions/wallet/sendTransaction) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).

__Warning: The `write` internally sends a transaction – it does not validate if the contract write will succeed (the contract may throw an error). It is highly recommended to [simulate the contract write with `contract.simulate`](https://viem.sh/docs/contract/writeContract#usage) before you execute it.__

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `abi` *extends* `Abi` \| readonly `unknown`[] | - |
| `functionName` *extends* `string` | - |
| `args` *extends* `unknown` | - |
| `chainOverride` *extends* `Chain` \| `undefined` | `undefined` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `WriteContractSyncParameters`\<`abi`, `functionName`, `args`, `Chain` \| `undefined`, `Account` \| `undefined`, `chainOverride`\> | WriteContractSyncParameters |

###### Returns

`Promise`\<`TransactionReceipt`\>

A [Transaction Receipt](https://viem.sh/docs/glossary/terms#receipt). WriteContractSyncReturnType

###### Example

```ts
import { createWalletClient, custom, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const receipt = await client.writeContractSync({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
  functionName: 'mint',
  args: [69420],
})
```

### size

> **size**: () => `number`

#### Returns

`number`

## Example

```js
import { createSessionManager } from '@tevm/mcp'

const sessions = createSessionManager()
const { handle } = await sessions.createLocal()
const client = sessions.get(handle)
console.log(await client.getBlockNumber())
```
