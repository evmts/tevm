# Snapshot-paths lint

Scope: the diff only, restricted to `__snapshots__/**`, `__rpc_snapshots__/**`,
and inline snapshots (`toMatchInlineSnapshot`) in `*.spec.ts` files.

Repository rule (CLAUDE.md, FILE_BASED_TESTS): a snapshot must not depend on
the machine that recorded it. Report any added or changed snapshot content
that contains:

- An absolute path (`/Users/`, `/home/`, `C:\\`, or the repository root).
- A machine-specific temp directory (`/tmp/`, `/private/tmp/`, `$TMPDIR`).
- A hostname, username, or process id.
- A dependency version string that changes on every upgrade when the
  assertion is not about the version (for example a viem version embedded in
  an error message that a pattern would match more robustly).

For each finding give the file, the line, and the replacement: a relative
path, a `expect.stringMatching(...)` pattern, or an error message that
omits the path.

When the diff updates snapshots after a dependency upgrade, check that the
change is only the version string or the new library behavior, not a
successful call turning into an error; report the latter as a probable
regression rather than an expected diff.

In fix mode, rewrite the offending snapshot content to the relative or
pattern form and leave every other line byte-identical.
