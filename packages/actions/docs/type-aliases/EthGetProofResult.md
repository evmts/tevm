[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / EthGetProofResult

# Type Alias: EthGetProofResult

> **EthGetProofResult** = `object`

Defined in: [packages/actions/src/eth/EthResult.ts:338](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L338)

JSON-RPC response for `eth_getProof` procedure (EIP-1186)
Returns the account and storage values of the specified account including the Merkle-proof.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="accountproof"></a> `accountProof` | [`Hex`](Hex.md)[] | The account proof (array of RLP-serialized merkle trie nodes) | [packages/actions/src/eth/EthResult.ts:346](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L346) |
| <a id="address"></a> `address` | [`Address`](Address.md) | The address of the account | [packages/actions/src/eth/EthResult.ts:342](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L342) |
| <a id="balance"></a> `balance` | [`Hex`](Hex.md) | The balance of the account | [packages/actions/src/eth/EthResult.ts:350](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L350) |
| <a id="codehash"></a> `codeHash` | [`Hex`](Hex.md) | The code hash of the account | [packages/actions/src/eth/EthResult.ts:354](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L354) |
| <a id="nonce"></a> `nonce` | [`Hex`](Hex.md) | The nonce of the account | [packages/actions/src/eth/EthResult.ts:358](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L358) |
| <a id="storagehash"></a> `storageHash` | [`Hex`](Hex.md) | The storage hash (root of the storage trie) | [packages/actions/src/eth/EthResult.ts:362](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L362) |
| <a id="storageproof"></a> `storageProof` | [`StorageProof`](StorageProof.md)[] | Array of storage proofs for the requested keys | [packages/actions/src/eth/EthResult.ts:366](https://github.com/evmts/tevm/blob/main/packages/actions/src/eth/EthResult.ts#L366) |
