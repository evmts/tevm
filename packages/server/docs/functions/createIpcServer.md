[**@tevm/server**](../README.md)

***

[@tevm/server](../globals.md) / createIpcServer

# Function: createIpcServer()

> **createIpcServer**(`client`, `options?`, `limits?`): `Server`

Defined in: [createIpcServer.js:12](https://github.com/evmts/tevm/blob/main/packages/server/src/createIpcServer.js#L12)

Create an IPC server supporting native RPC and connection-scoped subscriptions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`Client`](../type-aliases/Client.md) | - |
| `options?` | `ServerOpts` | - |
| `limits?` | \{ `maxMessageSize?`: `number`; \} | - |
| `limits.maxMessageSize?` | `number` | - |

## Returns

`Server`
