# Diagnose a native conformance failure

Input: a failing Guillotine Mini fixture identifier and optional suite.

1. Locate the native fixture in `../guillotine-mini` and reproduce it with the pinned Zig target. Do not regenerate unrelated fixtures.
2. Compare its native trace with the fixture's named reference. Identify whether the failure belongs to Guillotine Mini execution, Voltaire state/primitives, ZEVM RPC, or TEVM transport.
3. Write a diagnosis and concrete regression/fix plan under `factory/queue/conformance/`. Include the exact fixture, command, observed mismatch, owning repository, and files that need changes.
4. Do not change sibling repositories from this factory action. Their patches need a candidate with an explicit write set in the owning repository. Do not commit, publish, or mark a failing assertion skipped.
