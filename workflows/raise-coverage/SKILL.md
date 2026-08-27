# Raise a package's coverage floor

Input: a package directory (for example `packages/txpool`) and optionally a
target line-coverage percentage. Without a target, raise every threshold by
five points or to what the new run measures, whichever is lower.

1. Run the package's coverage (`vitest run --coverage` in the package; never
   the bare `test` script, which is interactive). Read `coverage/coverage-summary.json`
   and list the files with the lowest line and branch coverage.
2. For each of the lowest files, read the implementation and write the
   missing cases in the colocated `<name>.spec.ts`. Tests use real objects:
   `createTevmNode()`, `createMemoryClient()`, real compiled contracts from
   `@tevm/test-utils`, recorded RPC snapshots. No `vi.mock`, no `vi.fn` on
   tevm objects (CLAUDE.md, testing conventions).
3. Cover error paths through the real error classes in `@tevm/errors`:
   assert on the error name and message, not on a mock being called.
4. Re-run coverage. Raise `thresholds` in the package's `vitest.config.ts` to
   the measured values rounded down to two decimals, and never above what
   the run measured. Do not touch `autoUpdate`.
5. Run the package's full test suite and its typecheck. Every test passes.

Do not change implementation files to make coverage easier. If a file is
unreachable dead code, report it in your final message instead of testing it.
