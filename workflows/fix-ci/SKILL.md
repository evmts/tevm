# Fix CI

Input: optionally one target label to fix first.

The `//:ci` suite report you start from lists every red target with its
log. Work from the bottom of the dependency graph up: a red build in
`packages/utils` explains red tests in twenty packages, so fix builds, then
typechecks, then tests, then lints.

1. For each red target, read its log and find the first real error (not the
   cascade). Reproduce it with the package's own script
   (`vitest run <file>`, `tsc --noEmit`, `biome check .`) before editing.
2. Fix the cause in the package that owns it. Do not skip tests, widen
   types to `any`, add `// @ts-ignore` outside test files, or loosen a
   coverage threshold. A dependency version conflict is fixed in the
   manifest and lockfile, not by patching `node_modules`.
3. If a failure is a real regression in behavior, fix the behavior and keep
   the test. If the test asserts something the code no longer promises
   (and a changeset documents that), update the test and say so.
4. Formatting and lint failures: run the package's `biome check --write
   --unsafe` and review the diff before keeping it.
5. Re-run the failed target, then the package's full `check`, then move to
   the next red target. Stop editing when `//:ci` is green.

Final message: each target that was red, the root cause in one sentence,
and the fix. Anything you could not fix, with the reason, so a human can
take it.
