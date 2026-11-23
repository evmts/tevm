[**@tevm/contract**](../README.md)

***

[@tevm/contract](../globals.md) / EventActionCreator

# Type Alias: EventActionCreator\<TSourceAbi, TBytecode, TDeployedBytecode, TAddress, TAddressArgs, TAbi\>

> **EventActionCreator**\<`TSourceAbi`, `TBytecode`, `TDeployedBytecode`, `TAddress`, `TAddressArgs`, `TAbi`\> = \{ \[TEventName in ExtractAbiEventNames\<TAbi\>\]: (params: Pick\<CreateEventFilterParameters\<ExtractAbiEvent\<TAbi, TEventName\>, TAbi, TStrict, TFromBlock, TToBlock, TEventName, MaybeExtractEventArgsFromAbi\<TAbi, TEventName\>\>, "fromBlock" \| "toBlock" \| "args" \| "strict"\>) =\> CreateEventFilterParameters\<ExtractAbiEvent\<TAbi, TEventName\>, TAbi, TStrict, TFromBlock, TToBlock, TEventName, MaybeExtractEventArgsFromAbi\<TAbi, TEventName\>\> & \{ abi: \[ExtractAbiEvent\<TAbi, TEventName\>\]; bytecode: TBytecode; deployedBytecode: TDeployedBytecode; eventName: TEventName \} & \{ abi: \[ExtractAbiEvent\<TAbi, TEventName\>\]; bytecode: TBytecode; deployedBytecode: TDeployedBytecode; eventName: TEventName; humanReadableAbi: FormatAbi\<\[ExtractAbiEvent\<TAbi, TEventName\>\]\> \} & TAddressArgs \}

Defined in: [packages/contract/src/event/EventActionCreator.ts:57](https://github.com/evmts/tevm/blob/main/packages/contract/src/event/EventActionCreator.ts#L57)

A mapping of event names to action creators for events. Can be used to create event filters in a typesafe way.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TSourceAbi` *extends* `Abi` \| readonly `string`[] | - | The JSON or human-readable ABI of the contract. |
| `TBytecode` *extends* `Hex` \| `undefined` | - | The bytecode of the contract. |
| `TDeployedBytecode` *extends* `Hex` \| `undefined` | - | The deployed bytecode of the contract. |
| `TAddress` *extends* `Address` \| `undefined` | - | The address of the contract. |
| `TAddressArgs` | `TAddress` *extends* `undefined` ? `object` : `object` | Additional arguments for the address. |
| `TAbi` *extends* `Abi` | `TSourceAbi` *extends* readonly `string`[] ? `ParseAbi`\<`TSourceAbi`\> : `Extract`\<`TSourceAbi`, `Abi`\> | The JSON ABI used to construct event filters. |

## Example

```typescript
// Creating an event filter for a Transfer event
const filter = MyContract.events.Transfer({
  fromBlock: 'latest',
  toBlock: 'latest',
  args: { from: '0x1234...', to: '0x5678...' }
})

// Using the filter with tevm
const logs = await tevm.eth.getLogs(filter)
```
