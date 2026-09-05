# Repair a JSON-RPC regression

Input: an observed bug with actual and expected wire values, optionally the
method name and the protocol/reference behavior.

This lane repairs a regression; it does not add unrelated methods or refactor a
namespace. Work in this order:

1. Locate the nearest public boundary that reproduces the report: the JSON-RPC
   dispatcher, HTTP/WebSocket/IPC server, or memory client. Trace inward through
   the response type, native engine request, and conversion helper. Read the
   equivalent neighboring method before editing.
2. Write the smallest focused test first and run it against the unmodified
   implementation. Record that it fails for the reported reason. Use real
   `createTevmNode()`/`createMemoryClient()` objects and recorded RPC fixtures;
   do not mock TEVM objects.
3. Pin the expected behavior to the supplied reference. If no reference was
   supplied, use a repository conformance fixture or an established neighboring
   method. If those disagree or do not define the edge case, stop and report
   the ambiguity rather than inventing Ethereum semantics.
4. Make the minimum implementation change. Review the complete contract matrix
   for this method even when only one conversion changes:
   request/params type, result/response type, handler, procedure, namespace
   unions, native dispatch table, memory-client exposure,
   named barrels, and `tevm` facade.
5. Assert the wire shape exactly and prove `JSON.stringify(response)` succeeds.
   JSON-RPC outputs contain no `Promise`, `bigint`, typed array, `Error`, or
   `undefined`. Quantities use minimal hex; byte data is even-length; fixed
   storage words are 32-byte left-padded; spec-nullable fields are `null`.
6. Cover the report's alternate/negative branch: null and error provider
   responses, short and full-width encodings, legacy transaction fields,
   missing transport, manual mining, or state transitions as applicable. Assert
   the stable error class and JSON-RPC numeric code. Do not share mutable clients,
   `Common` instances, caches, or timers between test cases.
7. Correct JSDoc and guide text only where the repaired public contract was
   wrong. Examples are executable, fully imported, and type-valid.
8. Add a patch changeset naming every published package whose runtime behavior
   changed. Run all declared gates and keep the diff focused on this method.

Do not update snapshots until the focused semantic assertions pass. Never turn
an unexpected error snapshot into the new expected behavior merely to make the
suite green.

Execution and state belong to sibling ZEVM, Voltaire, and Guillotine Mini repositories. This action may fix TEVM host adapters. If the regression requires a native patch, identify the owning files and required regression in the result; do not recreate a JavaScript engine or edit outside the candidate write set.
