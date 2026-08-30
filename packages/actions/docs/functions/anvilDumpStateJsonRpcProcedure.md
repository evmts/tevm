[**@tevm/actions**](../README.md)

***

[@tevm/actions](../globals.md) / anvilDumpStateJsonRpcProcedure

# Function: anvilDumpStateJsonRpcProcedure()

> **anvilDumpStateJsonRpcProcedure**(`client`): [`AnvilDumpStateProcedure`](../type-aliases/AnvilDumpStateProcedure.md)

Defined in: [packages/actions/src/anvil/anvilDumpStateProcedure.js:15](https://github.com/evmts/tevm/blob/main/packages/actions/src/anvil/anvilDumpStateProcedure.js#L15)

Request handler for anvil_dumpState JSON-RPC requests.

The result is an opaque hex string, matching Anvil's response shape. The
encoded payload is specific to Tevm and can be passed back to
`anvil_loadState`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `TevmNode`\<`"fork"` \| `"normal"`, \{ \}\> | - |

## Returns

[`AnvilDumpStateProcedure`](../type-aliases/AnvilDumpStateProcedure.md)
