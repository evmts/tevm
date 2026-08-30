# Add a JSON-RPC method

Input: a method name (`eth_*`, `anvil_*`, `debug_*`, or `tevm_*`), optionally
its spec and the viem-style action name to expose on the client.

The whole JSON-RPC API lives in `packages/actions`. Follow the repository's
documentation-driven order (CLAUDE.md): types and JSDoc first, a happy-path
test, the implementation, then the full suite. Match the house pattern of a
neighboring method in the same namespace (one file per item: the params
type, the result type, the handler, the JSON-RPC procedure, the spec).

1. Read the spec. For `eth_*` use ethereum/execution-apis; for `anvil_*` use
   the anvil reference; for `debug_*` use geth's debug namespace. Decline a
   method whose semantics you cannot pin to a spec.
2. Types. Add `<Method>Params.ts`, `<Method>Result.ts`, and the
   `<Method>JsonRpcRequest/Response/Procedure` types beside the neighboring
   method. Full JSDoc with a complete `@example` that imports from `tevm`
   and runs; no `...` placeholders.
3. Happy-path test. Add `<method>Handler.spec.ts` against a real
   `createTevmNode()` (no mocks). If the method reads chain state, use the
   snapshot transport from `@tevm/test-utils` so the test replays without
   network.
4. Implementation. `<method>Handler.js` in JavaScript with JSDoc, using the
   internal ethereumjs API through the node; `<method>Procedure.js`
   converting hex JSON-RPC params to the handler's params. Debug logging
   through the node's logger where a Logger is available.
5. Register the procedure in the request-handler dispatch table and, if the
   input named a client method, add the action to `packages/memory-client`
   and the decorator in `packages/decorators`. Update every request, response,
   params, result, handler, procedure, request-handler, and method-matrix union
   that represents neighboring methods; do not leave a method reachable through
   only one dispatch path.
6. Barrels. Re-export every new symbol by name through each `index.js` up
   to `packages/actions/src/index.js`, then `tevm/actions/index.ts` and, for
   client methods, `tevm/memory-client/index.ts`.
7. Regenerate the committed tevm emit (`//tevm:dist --write`,
   `//tevm:types --write`).
8. Docs. Add the method to the JSON-RPC reference page under
   `docs/node/pages` with one example.
9. Changeset. `minor` for the packages touched, one sentence naming the
   method.
10. Add a wire-contract test through the public JSON-RPC procedure or transport.
    Assert the exact encoded response and prove `JSON.stringify(response)`
    succeeds. No `Promise`, `bigint`, typed array, `Error`, or `undefined` may
    cross the boundary. Quantities are minimal hex, byte data is even-length,
    fixed words are left-padded, and spec-nullable fields use `null`.
11. Cover the method's negative or alternate form and assert its stable error
    class and numeric JSON-RPC code. When parity with Anvil/geth/viem is claimed,
    name the reference fixture in the test.
12. Run the actions test suite. Every test in the package passes, not only
    the new one.

PR title: `✨ feat(actions): add <method>`. Body: what the method does, the
spec link, and the packages it touches. Do not touch unrelated handlers.
