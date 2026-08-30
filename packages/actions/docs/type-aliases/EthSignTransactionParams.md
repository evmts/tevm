[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthSignTransactionParams

# Type Alias: EthSignTransactionParams

> **EthSignTransactionParams** = `object`

Defined in: [packages/actions/src/eth/EthParams.ts:289](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L289)

**`Experimental`**

Based on the JSON-RPC request for `eth_signTransaction` procedure

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="accesslist"></a> `accessList?` | `readonly` | readonly `object`[] | - | [packages/actions/src/eth/EthParams.ts:325](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L325) |
| <a id="authorizationlist"></a> `authorizationList?` | `readonly` | readonly `unknown`[] | - | [packages/actions/src/eth/EthParams.ts:326](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L326) |
| <a id="blobversionedhashes"></a> `blobVersionedHashes?` | `readonly` | readonly [`Hex`](Hex.md)[] | - | [packages/actions/src/eth/EthParams.ts:327](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L327) |
| <a id="data"></a> `data?` | `readonly` | [`Hex`](Hex.md) | The compiled code of a contract OR the hash of the invoked method signature and encoded parameters. Optional if creating a contract. | [packages/actions/src/eth/EthParams.ts:320](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L320) |
| <a id="from"></a> `from` | `readonly` | [`Address`](Address.md) | The address from which the transaction is sent from | [packages/actions/src/eth/EthParams.ts:293](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L293) |
| <a id="gas"></a> `gas?` | `readonly` | `bigint` | The gas provded for transaction execution. It will return unused gas. Default value is 90000 | [packages/actions/src/eth/EthParams.ts:303](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L303) |
| <a id="gasprice"></a> `gasPrice?` | `readonly` | `bigint` | Integer of the gasPrice used for each paid gas, in Wei. If not provided tevm will default to the eth_gasPrice value | [packages/actions/src/eth/EthParams.ts:308](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L308) |
| <a id="maxfeeperblobgas"></a> `maxFeePerBlobGas?` | `readonly` | `bigint` | - | [packages/actions/src/eth/EthParams.ts:311](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L311) |
| <a id="maxfeepergas"></a> `maxFeePerGas?` | `readonly` | `bigint` | - | [packages/actions/src/eth/EthParams.ts:309](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L309) |
| <a id="maxpriorityfeepergas"></a> `maxPriorityFeePerGas?` | `readonly` | `bigint` | - | [packages/actions/src/eth/EthParams.ts:310](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L310) |
| <a id="nonce"></a> `nonce?` | `readonly` | `bigint` | Integer of a nonce. This allows to overwrite your own pending transactions that use the same nonce. | [packages/actions/src/eth/EthParams.ts:324](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L324) |
| <a id="to"></a> `to?` | `readonly` | [`Address`](Address.md) | The address the transaction is directed to. Optional if creating a contract | [packages/actions/src/eth/EthParams.ts:298](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L298) |
| <a id="type"></a> `type?` | `readonly` | `"legacy"` \| `"eip2930"` \| `"eip1559"` \| `"eip4844"` \| `"eip7702"` | - | [packages/actions/src/eth/EthParams.ts:328](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L328) |
| <a id="value"></a> `value?` | `readonly` | `bigint` | Integer of the value sent with this transaction, in Wei. | [packages/actions/src/eth/EthParams.ts:315](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L315) |
