---
"@tevm/cli": patch
"@tevm/errors": patch
"@tevm/utils": patch
---

Fix `ForkError` plain-object cause wrapping so constructing `ForkError` with an `{ code, message }` cause no longer throws `TypeError: Cannot construct BaseError instances directly`, tighten `invariant` condition typing from `any` to `unknown`, remove explicit `any` and unused `@ts-expect-error` directives across `@tevm/cli`, and fix forked editor script brace generation in `generateTemplates`.
