[**@tevm/utils**](../README.md)

***

[@tevm/utils](../globals.md) / signMessage

# Function: signMessage()

> **signMessage**(`__namedParameters`): `Promise`\<`` `0x${string}` ``\>

Defined in: node\_modules/.pnpm/viem@2.49.3\_bufferutil@4.1.0\_typescript@6.0.3\_utf-8-validate@5.0.10\_zod@4.4.3/node\_modules/viem/\_types/accounts/utils/signMessage.d.ts:19

## Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | `SignMessageParameters` |

## Returns

`Promise`\<`` `0x${string}` ``\>

The signature.

## Description

Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191):
`keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
