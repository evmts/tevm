[**tevm**](../../README.md)

***

[tevm](../../modules.md) / [index](../README.md) / bytesToBigInt

# Function: bytesToBigInt()

> **bytesToBigInt**(`bytes`, `opts?`): `bigint`

Decodes a byte array into a bigint.

- Docs: https://viem.sh/docs/utilities/fromBytes#bytestobigint

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `bytes` | `ByteArray` | Byte array to decode. |
| `opts?` | `BytesToBigIntOpts` | Options. |

## Returns

`bigint`

BigInt value.

## Example

```ts
import { bytesToBigInt } from 'viem'
const data = bytesToBigInt(new Uint8Array([1, 164]))
// 420n
```
