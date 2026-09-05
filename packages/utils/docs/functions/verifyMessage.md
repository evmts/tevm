[**@tevm/utils**](../README.md)

***

[@tevm/utils](../globals.md) / verifyMessage

# Function: verifyMessage()

> **verifyMessage**(`parameters`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/viem@2.49.3\_bufferutil@4.1.0\_typescript@6.0.3\_utf-8-validate@5.0.10\_zod@4.4.3/node\_modules/viem/\_types/utils/signature/verifyMessage.d.ts:29

Verify that a message was signed by the provided address.

Note:  Only supports Externally Owned Accounts. Does not support Contract Accounts.
       It is highly recommended to use `publicClient.verifyMessage` instead to ensure
       wallet interoperability.

- Docs [https://viem.sh/docs/utilities/verifyMessage](https://viem.sh/docs/utilities/verifyMessage)

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parameters` | `VerifyMessageParameters` | VerifyMessageParameters |

## Returns

`Promise`\<`boolean`\>

Whether or not the signature is valid. VerifyMessageReturnType
