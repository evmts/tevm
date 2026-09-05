[**@tevm/ethers**](../README.md)

***

[@tevm/ethers](../globals.md) / TevmProvider

# Class: TevmProvider

Defined in: [extensions/ethers/src/TevmProvider.js:5](https://github.com/evmts/tevm/blob/main/extensions/ethers/src/TevmProvider.js#L5)

Ethers provider over the native ZEVM JSON-RPC engine.

## Extends

- `JsonRpcApiProvider`

## Constructors

### Constructor

> **new TevmProvider**(`client`): `TevmProvider`

Defined in: [extensions/ethers/src/TevmProvider.js:13](https://github.com/evmts/tevm/blob/main/extensions/ethers/src/TevmProvider.js#L13)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `MemoryClient` | - |

#### Returns

`TevmProvider`

#### Overrides

`JsonRpcApiProvider.constructor`

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="tevm"></a> `tevm` | `MemoryClient` | [extensions/ethers/src/TevmProvider.js:15](https://github.com/evmts/tevm/blob/main/extensions/ethers/src/TevmProvider.js#L15) |

## Accessors

### \_network

#### Get Signature

> **get** **\_network**(): `Network`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:235

Gets the [[Network]] this provider has committed to. On each call, the network
 is detected, and if it has changed, the call will reject.

##### Returns

`Network`

#### Inherited from

`JsonRpcApiProvider._network`

***

### destroyed

#### Get Signature

> **get** **destroyed**(): `boolean`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:419

If this provider has been destroyed using the [[destroy]] method.

 Once destroyed, all resources are reclaimed, internal event loops
 and timers are cleaned up and no further requests may be sent to
 the provider.

##### Returns

`boolean`

#### Inherited from

`JsonRpcApiProvider.destroyed`

***

### disableCcipRead

#### Get Signature

> **get** **disableCcipRead**(): `boolean`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:282

Prevent any CCIP-read operation, regardless of whether requested
 in a [[call]] using ``enableCcipRead``.

##### Returns

`boolean`

#### Set Signature

> **set** **disableCcipRead**(`value`): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:283

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `boolean` |

##### Returns

`void`

#### Inherited from

`JsonRpcApiProvider.disableCcipRead`

***

### paused

#### Get Signature

> **get** **paused**(): `boolean`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:438

Whether the provider is currently paused.

 A paused provider will not emit any events, and generally should
 not make any requests to the network, but that is up to sub-classes
 to manage.

 Setting ``paused = true`` is identical to calling ``.pause(false)``,
 which will buffer any events that occur while paused until the
 provider is unpaused.

##### Returns

`boolean`

#### Set Signature

> **set** **paused**(`pause`): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:439

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `pause` | `boolean` |

##### Returns

`void`

#### Inherited from

`JsonRpcApiProvider.paused`

***

### plugins

#### Get Signature

> **get** **plugins**(): `AbstractProviderPlugin`[]

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:269

Returns all the registered plug-ins.

##### Returns

`AbstractProviderPlugin`[]

#### Inherited from

`JsonRpcApiProvider.plugins`

***

### pollingInterval

#### Get Signature

> **get** **pollingInterval**(): `number`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:260

##### Returns

`number`

#### Inherited from

`JsonRpcApiProvider.pollingInterval`

***

### provider

#### Get Signature

> **get** **provider**(): `this`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:265

Returns ``this``, to allow an **AbstractProvider** to implement
 the [[ContractRunner]] interface.

##### Returns

`this`

#### Inherited from

`JsonRpcApiProvider.provider`

***

### ready

#### Get Signature

> **get** **ready**(): `boolean`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:281

Returns true only if the [[_start]] has been called.

##### Returns

`boolean`

#### Inherited from

`JsonRpcApiProvider.ready`

## Methods

### \_clearTimeout()

> **\_clearTimeout**(`timerId`): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:374

Clear a timer created using the [[_setTimeout]] method.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `timerId` | `number` |

#### Returns

`void`

#### Inherited from

`JsonRpcApiProvider._clearTimeout`

***

### \_detectNetwork()

> **\_detectNetwork**(): `Promise`\<`Network`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:256

Sub-classes may override this; it detects the *actual* network that
 we are **currently** connected to.

 Keep in mind that [[send]] may only be used once [[ready]], otherwise the
 _send primitive must be used instead.

#### Returns

`Promise`\<`Network`\>

#### Inherited from

`JsonRpcApiProvider._detectNetwork`

***

### \_forEachSubscriber()

> **\_forEachSubscriber**(`func`): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:387

Perform %%func%% on each subscriber.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `func` | (`s`) => `void` |

#### Returns

`void`

#### Inherited from

`JsonRpcApiProvider._forEachSubscriber`

***

### \_getAddress()

> **\_getAddress**(`address`): `string` \| `Promise`\<`string`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:332

Returns or resolves to the address for %%address%%, resolving ENS
 names and [[Addressable]] objects and returning if already an
 address.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `AddressLike` |

#### Returns

`string` \| `Promise`\<`string`\>

#### Inherited from

`JsonRpcApiProvider._getAddress`

***

### \_getBlockTag()

> **\_getBlockTag**(`blockTag?`): `string` \| `Promise`\<`string`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:337

Returns or resolves to a valid block tag for %%blockTag%%, resolving
 negative values and returning if already a valid block tag.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `blockTag?` | `BlockTag` |

#### Returns

`string` \| `Promise`\<`string`\>

#### Inherited from

`JsonRpcApiProvider._getBlockTag`

***

### \_getFilter()

> **\_getFilter**(`filter`): `PerformActionFilter` \| `Promise`\<`PerformActionFilter`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:343

Returns or resolves to a filter for %%filter%%, resolving any ENS
 names or [[Addressable]] object and returning if already a valid
 filter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `filter` | `Filter` \| `FilterByBlockHash` |

#### Returns

`PerformActionFilter` \| `Promise`\<`PerformActionFilter`\>

#### Inherited from

`JsonRpcApiProvider._getFilter`

***

### \_getOption()

> **\_getOption**\<`K`\>(`key`): `JsonRpcApiProviderOptions`\[`K`\]

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:230

Returns the value associated with the option %%key%%.

 Sub-classes can use this to inquire about configuration options.

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `JsonRpcApiProviderOptions` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `K` |

#### Returns

`JsonRpcApiProviderOptions`\[`K`\]

#### Inherited from

`JsonRpcApiProvider._getOption`

***

### \_getProvider()

> **\_getProvider**(`chainId`): `AbstractProvider`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:364

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `chainId` | `number` |

#### Returns

`AbstractProvider`

#### Inherited from

`JsonRpcApiProvider._getProvider`

***

### \_getSubscriber()

> **\_getSubscriber**(`sub`): `Subscriber`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:277

Return a Subscriber that will manage the %%sub%%.

 Sub-classes may override this to modify the behavior of
 subscription management.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sub` | `Subscription` |

#### Returns

`Subscriber`

#### Inherited from

`JsonRpcApiProvider._getSubscriber`

***

### \_getTransactionRequest()

> **\_getTransactionRequest**(`_request`): `PerformActionTransaction` \| `Promise`\<`PerformActionTransaction`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:349

Returns or resolves to a transaction for %%request%%, resolving
 any ENS names or [[Addressable]] and returning if already a valid
 transaction.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_request` | `TransactionRequest` |

#### Returns

`PerformActionTransaction` \| `Promise`\<`PerformActionTransaction`\>

#### Inherited from

`JsonRpcApiProvider._getTransactionRequest`

***

### \_perform()

> **\_perform**(`req`): `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:248

Resolves to the non-normalized value by performing %%req%%.

 Sub-classes may override this to modify behavior of actions,
 and should generally call ``super._perform`` as a fallback.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | `PerformActionRequest` |

#### Returns

`Promise`\<`any`\>

#### Inherited from

`JsonRpcApiProvider._perform`

***

### \_recoverSubscriber()

> **\_recoverSubscriber**(`oldSub`, `newSub`): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:402

If a [[Subscriber]] fails and needs to replace itself, this
 method may be used.

 For example, this is used for providers when using the
 ``eth_getFilterChanges`` method, which can return null if state
 filters are not supported by the backend, allowing the Subscriber
 to swap in a [[PollingEventSubscriber]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `oldSub` | `Subscriber` |
| `newSub` | `Subscriber` |

#### Returns

`void`

#### Inherited from

`JsonRpcApiProvider._recoverSubscriber`

***

### \_send()

> **\_send**(`payload`): `Promise`\<(`JsonRpcResult` \| `JsonRpcError`)[]\>

Defined in: [extensions/ethers/src/TevmProvider.js:21](https://github.com/evmts/tevm/blob/main/extensions/ethers/src/TevmProvider.js#L21)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `payload` | `JsonRpcPayload` \| `JsonRpcPayload`[] | - |

#### Returns

`Promise`\<(`JsonRpcResult` \| `JsonRpcError`)[]\>

#### Overrides

`JsonRpcApiProvider._send`

***

### \_setTimeout()

> **\_setTimeout**(`_func`, `timeout?`): `number`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:383

Create a timer that will execute %%func%% after at least %%timeout%%
 (in ms). If %%timeout%% is unspecified, then %%func%% will execute
 in the next event loop.

 [Pausing](AbstractProvider-paused) the provider will pause any
 associated timers.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_func` | () => `void` |
| `timeout?` | `number` |

#### Returns

`number`

#### Inherited from

`JsonRpcApiProvider._setTimeout`

***

### \_start()

> **\_start**(): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:264

Sub-classes **MUST** call this. Until [[_start]] has been called, no calls
 will be passed to [[_send]] from [[send]]. If it is overridden, then
 ``super._start()`` **MUST** be called.

 Calling it multiple times is safe and has no effect.

#### Returns

`void`

#### Inherited from

`JsonRpcApiProvider._start`

***

### \_waitUntilReady()

> **\_waitUntilReady**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:270

Resolves once the [[_start]] has been called. This can be used in
 sub-classes to defer sending data until the connection has been
 established.

#### Returns

`Promise`\<`void`\>

#### Inherited from

`JsonRpcApiProvider._waitUntilReady`

***

### \_wrapBlock()

> **\_wrapBlock**(`value`, `network`): `Block`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:293

Provides the opportunity for a sub-class to wrap a block before
 returning it, to add additional properties or an alternate
 sub-class of [[Block]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `BlockParams` |
| `network` | `Network` |

#### Returns

`Block`

#### Inherited from

`JsonRpcApiProvider._wrapBlock`

***

### \_wrapLog()

> **\_wrapLog**(`value`, `network`): `Log`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:299

Provides the opportunity for a sub-class to wrap a log before
 returning it, to add additional properties or an alternate
 sub-class of [[Log]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `LogParams` |
| `network` | `Network` |

#### Returns

`Log`

#### Inherited from

`JsonRpcApiProvider._wrapLog`

***

### \_wrapTransactionReceipt()

> **\_wrapTransactionReceipt**(`value`, `network`): `TransactionReceipt`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:305

Provides the opportunity for a sub-class to wrap a transaction
 receipt before returning it, to add additional properties or an
 alternate sub-class of [[TransactionReceipt]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TransactionReceiptParams` |
| `network` | `Network` |

#### Returns

`TransactionReceipt`

#### Inherited from

`JsonRpcApiProvider._wrapTransactionReceipt`

***

### \_wrapTransactionResponse()

> **\_wrapTransactionResponse**(`tx`, `network`): `TransactionResponse`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:311

Provides the opportunity for a sub-class to wrap a transaction
 response before returning it, to add additional properties or an
 alternate sub-class of [[TransactionResponse]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tx` | `TransactionResponseParams` |
| `network` | `Network` |

#### Returns

`TransactionResponse`

#### Inherited from

`JsonRpcApiProvider._wrapTransactionResponse`

***

### addListener()

> **addListener**(`event`, `listener`): `Promise`\<`TevmProvider`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:410

Alias for [[on]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ProviderEvent` |
| `listener` | `Listener` |

#### Returns

`Promise`\<`TevmProvider`\>

#### Inherited from

`JsonRpcApiProvider.addListener`

***

### attachPlugin()

> **attachPlugin**(`plugin`): `this`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:273

Attach a new plug-in.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `plugin` | `AbstractProviderPlugin` |

#### Returns

`this`

#### Inherited from

`JsonRpcApiProvider.attachPlugin`

***

### broadcastTransaction()

> **broadcastTransaction**(`signedTx`): `Promise`\<`TransactionResponse`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:358

Broadcasts the %%signedTx%% to the network, adding it to the
 memory pool of any node for which the transaction meets the
 rebroadcast requirements.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `signedTx` | `string` |

#### Returns

`Promise`\<`TransactionResponse`\>

#### Inherited from

`JsonRpcApiProvider.broadcastTransaction`

***

### call()

> **call**(`_tx`): `Promise`\<`string`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:353

Simulate the execution of %%tx%%. If the call reverts, it will
 throw a [[CallExceptionError]] which includes the revert data.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_tx` | `TransactionRequest` |

#### Returns

`Promise`\<`string`\>

#### Inherited from

`JsonRpcApiProvider.call`

***

### ccipReadFetch()

> **ccipReadFetch**(`tx`, `calldata`, `urls`): `Promise`\<`string` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:287

Resolves to the data for executing the CCIP-read operations.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tx` | `PerformActionTransaction` |
| `calldata` | `string` |
| `urls` | `string`[] |

#### Returns

`Promise`\<`string` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.ccipReadFetch`

***

### destroy()

> **destroy**(): `void`

Defined in: [extensions/ethers/src/TevmProvider.js:28](https://github.com/evmts/tevm/blob/main/extensions/ethers/src/TevmProvider.js#L28)

Stop ethers polling and release the native engine.

#### Returns

`void`

#### Overrides

`JsonRpcApiProvider.destroy`

***

### emit()

> **emit**(`event`, ...`args`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:405

Triggers each listener for %%event%% with the %%args%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ProviderEvent` |
| ...`args` | `any`[] |

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

`JsonRpcApiProvider.emit`

***

### estimateGas()

> **estimateGas**(`_tx`): `Promise`\<`bigint`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:352

Estimates the amount of gas required to execute %%tx%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_tx` | `TransactionRequest` |

#### Returns

`Promise`\<`bigint`\>

#### Inherited from

`JsonRpcApiProvider.estimateGas`

***

### getAvatar()

> **getAvatar**(`name`): `Promise`\<`string` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:366

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\<`string` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.getAvatar`

***

### getBalance()

> **getBalance**(`address`, `blockTag?`): `Promise`\<`bigint`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:354

Get the account balance (in wei) of %%address%%. If %%blockTag%%
 is specified and the node supports archive access for that
 %%blockTag%%, the balance is as of that [[BlockTag]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `AddressLike` |
| `blockTag?` | `BlockTag` |

#### Returns

`Promise`\<`bigint`\>

#### Note

On nodes without archive access enabled, the %%blockTag%% may be
       **silently ignored** by the node, which may cause issues if relied on.

#### Inherited from

`JsonRpcApiProvider.getBalance`

***

### getBlock()

> **getBlock**(`block`, `prefetchTxs?`): `Promise`\<`Block` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:359

Resolves to the block for %%blockHashOrBlockTag%%.

 If %%prefetchTxs%%, and the backend supports including transactions
 with block requests, all transactions will be included and the
 [[Block]] object will not need to make remote calls for getting
 transactions.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `block` | `BlockTag` |
| `prefetchTxs?` | `boolean` |

#### Returns

`Promise`\<`Block` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.getBlock`

***

### getBlockNumber()

> **getBlockNumber**(): `Promise`\<`number`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:326

Get the current block number.

#### Returns

`Promise`\<`number`\>

#### Inherited from

`JsonRpcApiProvider.getBlockNumber`

***

### getCode()

> **getCode**(`address`, `blockTag?`): `Promise`\<`string`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:356

Get the bytecode for %%address%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `AddressLike` |
| `blockTag?` | `BlockTag` |

#### Returns

`Promise`\<`string`\>

#### Note

On nodes without archive access enabled, the %%blockTag%% may be
       **silently ignored** by the node, which may cause issues if relied on.

#### Inherited from

`JsonRpcApiProvider.getCode`

***

### getFeeData()

> **getFeeData**(): `Promise`\<`FeeData`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:351

Get the best guess at the recommended [[FeeData]].

#### Returns

`Promise`\<`FeeData`\>

#### Inherited from

`JsonRpcApiProvider.getFeeData`

***

### getLogs()

> **getLogs**(`_filter`): `Promise`\<`Log`[]\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:363

Resolves to the list of Logs that match %%filter%%

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_filter` | `Filter` \| `FilterByBlockHash` |

#### Returns

`Promise`\<`Log`[]\>

#### Inherited from

`JsonRpcApiProvider.getLogs`

***

### getNetwork()

> **getNetwork**(): `Promise`\<`Network`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:350

Get the connected [[Network]].

#### Returns

`Promise`\<`Network`\>

#### Inherited from

`JsonRpcApiProvider.getNetwork`

***

### getPlugin()

> **getPlugin**\<`T`\>(`name`): `T` \| `null`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:277

Get a plugin by name.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `AbstractProviderPlugin` | `AbstractProviderPlugin` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`T` \| `null`

#### Inherited from

`JsonRpcApiProvider.getPlugin`

***

### getResolver()

> **getResolver**(`name`): `Promise`\<`EnsResolver` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:365

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\<`EnsResolver` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.getResolver`

***

### getRpcError()

> **getRpcError**(`payload`, `_error`): `Error`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:302

Returns an ethers-style Error for the given JSON-RPC error
 %%payload%%, coalescing the various strings and error shapes
 that different nodes return, coercing them into a machine-readable
 standardized error.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `JsonRpcPayload` |
| `_error` | `JsonRpcError` |

#### Returns

`Error`

#### Inherited from

`JsonRpcApiProvider.getRpcError`

***

### getRpcRequest()

> **getRpcRequest**(`req`): \{ `args`: `any`[]; `method`: `string`; \} \| `null`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:292

Returns the request method and arguments required to perform
 %%req%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | `PerformActionRequest` |

#### Returns

\{ `args`: `any`[]; `method`: `string`; \} \| `null`

#### Inherited from

`JsonRpcApiProvider.getRpcRequest`

***

### getRpcTransaction()

> **getRpcTransaction**(`tx`): `JsonRpcTransactionRequest`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:287

Returns %%tx%% as a normalized JSON-RPC transaction request,
 which has all values hexlified and any numeric values converted
 to Quantity values.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tx` | `TransactionRequest` |

#### Returns

`JsonRpcTransactionRequest`

#### Inherited from

`JsonRpcApiProvider.getRpcTransaction`

***

### getSigner()

> **getSigner**(`address?`): `Promise`\<`JsonRpcSigner`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:329

Resolves to the [[Signer]] account for  %%address%% managed by
 the client.

 If the %%address%% is a number, it is used as an index in the
 the accounts from [[listAccounts]].

 This can only be used on clients which manage accounts (such as
 Geth with imported account or MetaMask).

 Throws if the account doesn't exist.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address?` | `string` \| `number` |

#### Returns

`Promise`\<`JsonRpcSigner`\>

#### Inherited from

`JsonRpcApiProvider.getSigner`

***

### getStorage()

> **getStorage**(`address`, `_position`, `blockTag?`): `Promise`\<`string`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:357

Get the storage slot value for %%address%% at slot %%position%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `AddressLike` |
| `_position` | `BigNumberish` |
| `blockTag?` | `BlockTag` |

#### Returns

`Promise`\<`string`\>

#### Note

On nodes without archive access enabled, the %%blockTag%% may be
       **silently ignored** by the node, which may cause issues if relied on.

#### Inherited from

`JsonRpcApiProvider.getStorage`

***

### getTransaction()

> **getTransaction**(`hash`): `Promise`\<`TransactionResponse` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:360

Resolves to the transaction for %%hash%%.

 If the transaction is unknown or on pruning nodes which
 discard old transactions this resolves to ``null``.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hash` | `string` |

#### Returns

`Promise`\<`TransactionResponse` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.getTransaction`

***

### getTransactionCount()

> **getTransactionCount**(`address`, `blockTag?`): `Promise`\<`number`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:355

Get the number of transactions ever sent for %%address%%, which
 is used as the ``nonce`` when sending a transaction. If
 %%blockTag%% is specified and the node supports archive access
 for that %%blockTag%%, the transaction count is as of that
 [[BlockTag]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `AddressLike` |
| `blockTag?` | `BlockTag` |

#### Returns

`Promise`\<`number`\>

#### Note

On nodes without archive access enabled, the %%blockTag%% may be
       **silently ignored** by the node, which may cause issues if relied on.

#### Inherited from

`JsonRpcApiProvider.getTransactionCount`

***

### getTransactionReceipt()

> **getTransactionReceipt**(`hash`): `Promise`\<`TransactionReceipt` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:361

Resolves to the transaction receipt for %%hash%%, if mined.

 If the transaction has not been mined, is unknown or on
 pruning nodes which discard old transactions this resolves to
 ``null``.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hash` | `string` |

#### Returns

`Promise`\<`TransactionReceipt` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.getTransactionReceipt`

***

### getTransactionResult()

> **getTransactionResult**(`hash`): `Promise`\<`string` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:362

Resolves to the result returned by the executions of %%hash%%.

 This is only supported on nodes with archive access and with
 the necessary debug APIs enabled.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hash` | `string` |

#### Returns

`Promise`\<`string` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.getTransactionResult`

***

### listAccounts()

> **listAccounts**(): `Promise`\<`JsonRpcSigner`[]\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:330

#### Returns

`Promise`\<`JsonRpcSigner`[]\>

#### Inherited from

`JsonRpcApiProvider.listAccounts`

***

### listenerCount()

> **listenerCount**(`event?`): `Promise`\<`number`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:406

Resolves to the number of listeners for %%event%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event?` | `ProviderEvent` |

#### Returns

`Promise`\<`number`\>

#### Inherited from

`JsonRpcApiProvider.listenerCount`

***

### listeners()

> **listeners**(`event?`): `Promise`\<`Listener`[]\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:407

Resolves to the listeners for %%event%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event?` | `ProviderEvent` |

#### Returns

`Promise`\<`Listener`[]\>

#### Inherited from

`JsonRpcApiProvider.listeners`

***

### lookupAddress()

> **lookupAddress**(`address`): `Promise`\<`string` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:368

Resolves to the ENS name associated for the %%address%% or
 ``null`` if the //primary name// is not configured.

 Users must perform additional steps to configure a //primary name//,
 which is not currently common.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `address` | `string` |

#### Returns

`Promise`\<`string` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.lookupAddress`

***

### off()

> **off**(`event`, `listener?`): `Promise`\<`TevmProvider`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:408

Unregister the %%listener%% for %%event%%. If %%listener%%
 is unspecified, all listeners are unregistered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ProviderEvent` |
| `listener?` | `Listener` |

#### Returns

`Promise`\<`TevmProvider`\>

#### Inherited from

`JsonRpcApiProvider.off`

***

### on()

> **on**(`event`, `listener`): `Promise`\<`TevmProvider`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:403

Registers a %%listener%% that is called whenever the
 %%event%% occurs until unregistered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ProviderEvent` |
| `listener` | `Listener` |

#### Returns

`Promise`\<`TevmProvider`\>

#### Inherited from

`JsonRpcApiProvider.on`

***

### once()

> **once**(`event`, `listener`): `Promise`\<`TevmProvider`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:404

Registers a %%listener%% that is called the next time
 %%event%% occurs.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ProviderEvent` |
| `listener` | `Listener` |

#### Returns

`Promise`\<`TevmProvider`\>

#### Inherited from

`JsonRpcApiProvider.once`

***

### pause()

> **pause**(`dropWhilePaused?`): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:445

Pause the provider. If %%dropWhilePaused%%, any events that occur
 while paused are dropped, otherwise all events will be emitted once
 the provider is unpaused.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dropWhilePaused?` | `boolean` |

#### Returns

`void`

#### Inherited from

`JsonRpcApiProvider.pause`

***

### removeAllListeners()

> **removeAllListeners**(`event?`): `Promise`\<`TevmProvider`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:409

Unregister all listeners for %%event%%.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event?` | `ProviderEvent` |

#### Returns

`Promise`\<`TevmProvider`\>

#### Inherited from

`JsonRpcApiProvider.removeAllListeners`

***

### removeListener()

> **removeListener**(`event`, `listener`): `Promise`\<`TevmProvider`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:411

Alias for [[off]].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `ProviderEvent` |
| `listener` | `Listener` |

#### Returns

`Promise`\<`TevmProvider`\>

#### Inherited from

`JsonRpcApiProvider.removeListener`

***

### resolveName()

> **resolveName**(`name`): `Promise`\<`string` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:367

Resolves to the address configured for the %%ensName%% or
 ``null`` if unconfigured.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\<`string` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.resolveName`

***

### resume()

> **resume**(): `void`

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:449

Resume the provider.

#### Returns

`void`

#### Inherited from

`JsonRpcApiProvider.resume`

***

### send()

> **send**(`method`, `params`): `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/provider-jsonrpc.d.ts:316

Requests the %%method%% with %%params%% via the JSON-RPC protocol
 over the underlying channel. This can be used to call methods
 on the backend that do not have a high-level API within the Provider
 API.

 This method queues requests according to the batch constraints
 in the options, assigns the request a unique ID.

 **Do NOT override** this method in sub-classes; instead
 override [[_send]] or force the options values in the
 call to the constructor to modify this method's behavior.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | `string` |
| `params` | `any`[] \| `Record`\<`string`, `any`\> |

#### Returns

`Promise`\<`any`\>

#### Inherited from

`JsonRpcApiProvider.send`

***

### waitForBlock()

> **waitForBlock**(`blockTag?`): `Promise`\<`Block`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:370

Resolves to the block at %%blockTag%% once it has been mined.

 This can be useful for waiting some number of blocks by using
 the ``currentBlockNumber + N``.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `blockTag?` | `BlockTag` |

#### Returns

`Promise`\<`Block`\>

#### Inherited from

`JsonRpcApiProvider.waitForBlock`

***

### waitForTransaction()

> **waitForTransaction**(`hash`, `_confirms?`, `timeout?`): `Promise`\<`TransactionReceipt` \| `null`\>

Defined in: node\_modules/.pnpm/ethers@6.16.0\_bufferutil@4.1.0\_utf-8-validate@5.0.10/node\_modules/ethers/lib.esm/providers/abstract-provider.d.ts:369

Waits until the transaction %%hash%% is mined and has %%confirms%%
 confirmations.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hash` | `string` |
| `_confirms?` | `number` \| `null` |
| `timeout?` | `number` \| `null` |

#### Returns

`Promise`\<`TransactionReceipt` \| `null`\>

#### Inherited from

`JsonRpcApiProvider.waitForTransaction`

***

### createMemoryProvider()

> `static` **createMemoryProvider**(`options?`): `Promise`\<`TevmProvider`\>

Defined in: [extensions/ethers/src/TevmProvider.js:7](https://github.com/evmts/tevm/blob/main/extensions/ethers/src/TevmProvider.js#L7)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `MemoryClientOptions` | - |

#### Returns

`Promise`\<`TevmProvider`\>
