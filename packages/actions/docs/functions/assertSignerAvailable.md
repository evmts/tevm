[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / assertSignerAvailable

# Function: assertSignerAvailable()

> **assertSignerAvailable**(`client`, `from`): `void`

Defined in: [packages/actions/src/internal/assertSignerAvailable.js:38](https://github.com/evmts/tevm/blob/main/packages/actions/src/internal/assertSignerAvailable.js#L38)

Asserts that the node is able to sign for `from`, emulating anvil's signer semantics.

Tevm auto-impersonates every sender by default, which makes anvil's `No Signer available`
failure path unobservable. When a node is created with `strictImpersonation: true` (or
`node.setStrictImpersonation(true)` is called) this assertion enforces anvil's rules:

- one of the prefunded dev accounts → allowed (anvil has their private keys)
- the currently impersonated account → allowed
- auto impersonation enabled (`anvil_autoImpersonateAccount`) → allowed
- anything else → `NoSignerAvailableError`

When strict impersonation is disabled (the default) this is a no-op, so existing
permissive behavior is preserved.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `TevmNode`\<`"fork"` \| `"normal"`, \{ \}\> | The tevm node. |
| `from` | `` `0x${string}` `` \| `undefined` | The sender of the transaction. |

## Returns

`void`

## Throws

When strict impersonation is enabled and no signer exists for `from`.

## Example

```js
import { createTevmNode } from '@tevm/node'
import { assertSignerAvailable } from '@tevm/actions'

const node = createTevmNode({ strictImpersonation: true })

// throws NoSignerAvailableError
assertSignerAvailable(node, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')

node.setImpersonatedAccount('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
// no longer throws
assertSignerAvailable(node, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
```
