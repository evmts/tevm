[**@tevm/errors**](../README.md)

***

[@tevm/errors](../globals.md) / NoSignerAvailableError

# Class: NoSignerAvailableError

Represents an error that occurs when a transaction is sent from an address the
node cannot sign for.

Tevm is permissive by default: any `from` address is implicitly impersonated so
transactions always succeed. That is convenient for testing but it diverges from
anvil, which rejects `eth_sendTransaction` with `No Signer available` when the
sender is neither one of its dev accounts nor an actively impersonated account.

This error is thrown only when a node is created with `strictImpersonation: true`,
which makes tevm faithfully emulate anvil's behavior so that suites asserting the
failure path (for example viem's `impersonateAccount` / `stopImpersonatingAccount`
tests) can hold against tevm.

## Example

```ts
import { createTevmNode } from '@tevm/node'
import { NoSignerAvailableError } from '@tevm/errors'
import { ethSendTransactionHandler } from '@tevm/actions'

const node = createTevmNode({ strictImpersonation: true })

try {
  await ethSendTransactionHandler(node)({
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0000000000000000000000000000000000000001',
    value: 0n,
  })
} catch (error) {
  if (error instanceof NoSignerAvailableError) {
    console.error(error.message) // No Signer available for 0x1234...
  }
}
```

## Param

A human-readable error message.

## Param

Additional parameters for the BaseError.

## Extends

- [`BaseError`](BaseError.md)

## Constructors

### Constructor

> **new NoSignerAvailableError**(`message`, `args?`, `tag?`): `NoSignerAvailableError`

Constructs a NoSignerAvailableError.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `message` | `string` | `undefined` | Human-readable error message. |
| `args?` | [`NoSignerAvailableErrorParameters`](../interfaces/NoSignerAvailableErrorParameters.md) | `{}` | Additional parameters for the BaseError. |
| `tag?` | `string` | `'NoSignerAvailable'` | The tag for the error. |

#### Returns

`NoSignerAvailableError`

#### Overrides

[`BaseError`](BaseError.md).[`constructor`](BaseError.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="_tag"></a> `_tag` | `public` | `string` | `undefined` | - | [`BaseError`](BaseError.md).[`_tag`](BaseError.md#_tag) |
| <a id="cause"></a> `cause` | `public` | `any` | `undefined` | - | [`BaseError`](BaseError.md).[`cause`](BaseError.md#cause) |
| <a id="code"></a> `code` | `public` | `number` | `undefined` | - | [`BaseError`](BaseError.md).[`code`](BaseError.md#code) |
| <a id="details"></a> `details` | `public` | `string` | `undefined` | - | [`BaseError`](BaseError.md).[`details`](BaseError.md#details) |
| <a id="docspath"></a> `docsPath` | `public` | `string` \| `undefined` | `undefined` | - | [`BaseError`](BaseError.md).[`docsPath`](BaseError.md#docspath) |
| <a id="metamessages"></a> `metaMessages` | `public` | `string`[] \| `undefined` | `undefined` | - | [`BaseError`](BaseError.md).[`metaMessages`](BaseError.md#metamessages) |
| <a id="shortmessage"></a> `shortMessage` | `public` | `string` | `undefined` | - | [`BaseError`](BaseError.md).[`shortMessage`](BaseError.md#shortmessage) |
| <a id="version"></a> `version` | `public` | `string` | `undefined` | - | [`BaseError`](BaseError.md).[`version`](BaseError.md#version) |
| <a id="code-1"></a> `code` | `static` | `number` | `-32000` | The error code for NoSignerAvailableError. Matches anvil/hardhat's "resource not found" JSON-RPC code for an unknown account. | - |

## Methods

### walk()

> **walk**(`fn?`): `unknown`

Walks through the error chain.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fn?` | `Function` | A function to execute on each error in the chain. |

#### Returns

`unknown`

The first error that matches the function, or the original error.

#### Inherited from

[`BaseError`](BaseError.md).[`walk`](BaseError.md#walk)
