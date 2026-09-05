[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / PartialBy

# Type Alias: PartialBy\<T, K\>

> **PartialBy**\<`T`, `K`\> = [`Omit`](Omit.md)\<`T`, `K`\> & `ExactPartial`\<`Pick`\<`T`, `K`\>\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `K` *extends* keyof `T` |

## Description

Creates a type that is a partial of T, but with the required keys K.

## Example

```ts
PartialBy<{ a: string, b: number }, 'a'>
=> { a?: string, b: number }
```
