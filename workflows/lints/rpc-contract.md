# JSON-RPC contract lint

Scope: the diff only, restricted to JSON-RPC-facing code and tests.

TEVM has repeatedly shipped boundary bugs even when the internal value was
correct. Review the complete wire contract for every changed method, not just
the edited line. A method's request type, response type, handler, procedure,
dispatch registration, client/decorator exposure, error shape, and tests must
agree.

Report a blocking finding when the diff introduces or preserves one of these
problems in a changed method:

- A JSON-RPC result can contain a `Promise`, `bigint`, `Uint8Array`, `Error`,
  `undefined`, or another value that `JSON.stringify` cannot faithfully encode.
- Quantities are not minimal hex quantities (`0x0`, never `0x00`), byte data is
  not even-length, a fixed 32-byte word is not left-padded, or a spec-nullable
  field uses `'0x'`, `undefined`, or an omitted property instead of `null`.
- Required/optional fields disagree between the request/response types and the
  runtime procedure, or a handler result is read before an error/null response
  is handled.
- The method is missing from a namespace union, handler/procedure union,
  dispatch table, method matrix, client action, or public facade that already
  represents its neighboring methods.
- The error class, numeric JSON-RPC code, message, and documented `@throws`
  contract disagree.
- A changed conversion has no wire-level regression assertion. The test should
  call the public procedure or transport, assert the exact encoded result, and
  prove `JSON.stringify(response)` succeeds. When the change claims Anvil,
  geth, execution-apis, or viem parity, the fixture or expected value must name
  that reference.

Use the repository's neighboring methods as structural evidence. Do not invent
a standard requirement from memory: if the relevant spec is not in the diff or
repository and the local patterns conflict, report the uncertainty instead of
rewriting behavior.

Do not report internal handler values that are deliberately converted by the
procedure before crossing the wire. Do not broaden the review to untouched
methods.

In fix mode, make the smallest coherent correction across the changed method's
types, procedure, registration, and focused tests. Do not refactor adjacent
methods or change public behavior merely for stylistic consistency.
