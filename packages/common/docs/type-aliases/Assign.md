[**@tevm/common**](../README.md)

***

[@tevm/common](../globals.md) / Assign

# Type Alias: Assign\<T, U\>

> **Assign**\<`T`, `U`\> = `Assign_`\<`T`, `U`\> & `U`

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `U` |

## Description

Assigns the properties of U onto T.

## Example

```ts
Assign<{ a: string, b: number }, { a: undefined, c: boolean }>
=> { a: undefined, b: number, c: boolean }
```
