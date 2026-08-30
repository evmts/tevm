[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthGetProofParams

# Type Alias: EthGetProofParams

> **EthGetProofParams** = `object`

Defined in: [packages/actions/src/eth/EthParams.ts:360](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L360)

Based on the JSON-RPC request for `eth_getProof` procedure (EIP-1186)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="address"></a> `address` | `readonly` | [`Address`](Address.md) | The address of the account to get the proof for | [packages/actions/src/eth/EthParams.ts:364](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L364) |
| <a id="blocktag"></a> `blockTag?` | `readonly` | [`BlockParam`](BlockParam.md) | The block tag or block number to get the proof at | [packages/actions/src/eth/EthParams.ts:372](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L372) |
| <a id="storagekeys"></a> `storageKeys` | `readonly` | readonly [`Hex`](Hex.md)[] | An array of storage keys to get proofs for | [packages/actions/src/eth/EthParams.ts:368](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthParams.ts#L368) |
