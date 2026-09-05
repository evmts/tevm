[**@tevm/node**](../README.md)

***

[@tevm/node](../globals.md) / ZevmEngine

# Type Alias: ZevmEngine

> **ZevmEngine** = `object`

Defined in: packages/node/src/ZevmEngine.ts:25

Serialized access to ZEVM's native JSON-RPC dispatcher.
`request` returns an RPC result or throws a structured error. `rpc` accepts
raw JSON, including batches and notifications, and returns the wire response.
Events: `request`, `response`, `block`, `close`. Close releases native state.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="close"></a> `close` | () => `Promise`\<`void`\> | packages/node/src/ZevmEngine.ts:30 |
| <a id="events"></a> `events` | `EventEmitter` | packages/node/src/ZevmEngine.ts:26 |
| <a id="ready"></a> `ready` | () => `Promise`\<`void`\> | packages/node/src/ZevmEngine.ts:27 |
| <a id="request"></a> `request` | (`request`) => `Promise`\<[`JsonValue`](JsonValue.md)\> | packages/node/src/ZevmEngine.ts:28 |
| <a id="rpc"></a> `rpc` | (`json`) => `Promise`\<`string` \| `null`\> | packages/node/src/ZevmEngine.ts:29 |
