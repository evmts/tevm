[**@tevm/utils**](../README.md)

***

[@tevm/utils](../globals.md) / AsyncEventEmitter

# Type Alias: AsyncEventEmitter\<T\>

> **AsyncEventEmitter**\<`T`\> = `object`

Defined in: [packages/utils/src/index.ts:85](https://github.com/evmts/tevm/blob/main/packages/utils/src/index.ts#L85)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `Record`\<`string`, `any`\> | `object` |

## Methods

### emit()

> **emit**\<`K`\>(`event`, ...`args`): `boolean`

Defined in: [packages/utils/src/index.ts:89](https://github.com/evmts/tevm/blob/main/packages/utils/src/index.ts#L89)

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | `Parameters`\<`T`\[`K`\]\> |

#### Returns

`boolean`

***

### off()

> **off**\<`K`\>(`event`, `listener`): `void`

Defined in: [packages/utils/src/index.ts:88](https://github.com/evmts/tevm/blob/main/packages/utils/src/index.ts#L88)

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | `T`\[`K`\] |

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`event`, `listener`): `void`

Defined in: [packages/utils/src/index.ts:86](https://github.com/evmts/tevm/blob/main/packages/utils/src/index.ts#L86)

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | `T`\[`K`\] |

#### Returns

`void`

***

### once()

> **once**\<`K`\>(`event`, `listener`): `void`

Defined in: [packages/utils/src/index.ts:87](https://github.com/evmts/tevm/blob/main/packages/utils/src/index.ts#L87)

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | `T`\[`K`\] |

#### Returns

`void`

***

### removeAllListeners()

> **removeAllListeners**\<`K`\>(`event?`): `void`

Defined in: [packages/utils/src/index.ts:90](https://github.com/evmts/tevm/blob/main/packages/utils/src/index.ts#L90)

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event?` | `K` |

#### Returns

`void`
